import { getToken } from './auth';
import { get as getConfig } from './config';
import { t } from './i18n';
import getTabInfo from './tab';
import getLinkTitle from './link';
import { notification, closeNotification } from './notification';
import { woodpeckerFetch } from './fetch';
import storage from './storage';

const baseUrl = 'https://outlook.office.com/api/v2.0/me';

const FOLDERS_COUNT_CHUNK = 100;

export async function getFolders() {
  let access_token = await getToken();

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'GET_FOLDERS', access_token },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        }

        let folders = response && 'folders' in response ? response.folders : [];
        if (folders.length) {
          storage.local.set({ folders });
        }
        resolve(folders);
      }
    );
  }).catch((message) => notification(message));
}

export async function bgGetFolders(access_token) {
  let config = await getConfig();
  let debug = config.saveDebugInfo;
  let url = `${baseUrl}/taskfolders?top=${FOLDERS_COUNT_CHUNK}`;
  let folders = [];

  try {
    do {
      let chunkData = await woodpeckerFetch(
        url,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        },
        { debug }
      );
      if (debug) console.log('[1] chunkData:', chunkData);
      let chunkFolders = chunkData.value.map((folder) => {
        return {
          id: folder.Id,
          label: folder.Name,
          isDefault: folder.IsDefaultFolder,
        };
      });
      if (debug) console.log('[2] chunkFolders:', chunkFolders);
      folders = folders.concat(chunkFolders);
      url = chunkData['@odata.nextLink'] || '';
    } while (url !== '');
  } catch (res) {
    folders = [];
    let err = t('GetListsError');
    if (res.statusText || res.status) {
      err = err + '\n' + (res.statusText || `#${res.status}`);
    }
    notification(err);
  }
  if (debug) console.log('[3] folders:', folders);
  return folders;
}

export async function quickAddTask(info) {
  let config = await getConfig();
  let access_token = await getToken(false, true);
  let tabInfo = await getTabInfo();
  let title, description;

  if ('linkUrl' in info) {
    let linkUrl = info.linkUrl;
    let linkTitle = await getLinkTitle(linkUrl);
    let pageInfoTitle = t('CreatedOnPage');

    title = linkTitle || tabInfo.title;
    description = `${linkUrl}\n\n*** ${pageInfoTitle} ***\n${tabInfo.title}\n${tabInfo.url}`;
  } else {
    title = tabInfo.title;
    description = tabInfo.selected.trim().length
      ? `${tabInfo.selected}\n\n${tabInfo.url}`
      : tabInfo.url;
  }

  let task = { title, description };

  return bgAddTask(access_token, task)
    .then(() => {
      if (config.notifyOnSuccess) {
        notification(t('SuccessNotification')).then((id) =>
          closeNotification(id)
        );
      }
    })
    .catch((res) => {
      let err =
        t('ErrorNotification') + ' – \n' + (res.statusText || `#${res.status}`);
      notification(err);
    });
}

export async function addTask(task) {
  let access_token = await getToken();

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'ADD_TASK', access_token, task },
      (res) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        }
        if (res.ok) {
          resolve(res.response);
        } else {
          reject(res.response);
        }
      }
    );
  });
}

export async function bgAddTask(access_token, task) {
  let config = await getConfig();
  let url =
    'list' in task
      ? `${baseUrl}/taskfolders('${task.list}')/tasks`
      : `${baseUrl}/tasks`;
  let T = {
    Subject: task.title,
    Body: {
      Content: task.description,
      ContentType: 'Text',
    },
    Importance: task.importance ? 'High' : 'Normal',
  };

  if (task.reminder) {
    T.IsReminderOn = true;
    T.ReminderDateTime = {
      DateTime: task.reminder,
      TimeZone: currentTimeZone(),
    };
  }

  if (task.due) {
    T.DueDateTime = {
      DateTime: task.due,
      TimeZone: currentTimeZone(),
    };
  }

  return woodpeckerFetch(
    url,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(T),
    },
    { timeout: null, debug: config.saveDebugInfo }
  );
}

function currentTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
