import { getToken } from './auth';
import { get as getConfig } from './config';
import { t } from './i18n';
import getTabInfo from './tab';
import getLinkTitle from './link';
import { notification, closeNotification } from './notification';
import { woodpeckerFetch } from './fetch';
import storage from './storage';

const baseUrl = 'https://graph.microsoft.com/v1.0/me/todo';

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
  const config = await getConfig();
  const debug = config.saveDebugInfo;

  const deltaLink = (await chrome.storage.local.get('deltaLink')).deltaLink;
  let folders = deltaLink
    ? (await chrome.storage.local.get('folders')).folders
    : [];
  const isDelta = deltaLink && folders;

  let url = isDelta ? deltaLink : `${baseUrl}/lists/delta`;

  let chunkData;
  try {
    do {
      if (debug) console.log('[0] URL:', url);
      chunkData = await woodpeckerFetch(
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

      if (isDelta) {
        // update folders
        chunkData.value.forEach((folder) => {
          if (folder['@removed']) {
            folders = folders.filter((f) => f.id !== folder.id);
          } else {
            let idx = folders.findIndex((f) => f.id === folder.id);
            if (idx >= 0) {
              folders[idx].label = folder.displayName;
              folders[idx].isDefault =
                folder.wellknownListName === 'defaultList';
            } else {
              folders.push({
                id: folder.id,
                label: folder.displayName,
                isDefault: folder.wellknownListName === 'defaultList',
              });
            }
          }
        });
      } else {
        // append folders
        let chunkFolders = chunkData.value.map((folder) => {
          return {
            id: folder.id,
            label: folder.displayName,
            isDefault: folder.wellknownListName === 'defaultList',
          };
        });
        if (debug) console.log('[2] chunkFolders:', chunkFolders);
        folders = folders.concat(chunkFolders);
      }

      url = chunkData['@odata.nextLink'] || '';
    } while (url !== '');

    chrome.storage.local.set({ deltaLink: chunkData['@odata.deltaLink'] });
  } catch (res) {
    folders = [];
    let err = t('GetListsError');
    if (res.statusText || res.status) {
      err = err + '\n' + (res.statusText || `#${res.status}`);
    }
    notification(err);
  }

  if (debug) console.log('[3.1] folders:', folders);
  if (config.sortListsByName) {
    folders.sort((a, b) => a.label.localeCompare(b.label));
    if (debug) console.log('[3.2] sorted folders:', folders);
  }

  return folders;
}

export async function quickAddTask(info) {
  let config = await getConfig();
  let access_token = await getToken(false, true);
  let tabInfo = await getTabInfo();
  let title, description;

  if (info && 'linkUrl' in info) {
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
  if (config.listDefault) task.list = config.listDefault;

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
  const debug = config.saveDebugInfo;

  if (debug) console.log('[0] Task:', task);

  let taskList;
  if (!task.list) {
    const folders = (await chrome.storage.local.get('folders')).folders;
    taskList = folders.find((f) => f.isDefault).id;
  } else {
    taskList = task.list;
  }
  if (debug) console.log('[1] TaskList:', taskList);

  const url = `${baseUrl}/lists/${taskList}/tasks`;
  if (debug) console.log('[2] URL:', url);

  let T = {
    title: task.title,
    body: {
      content: task.description,
      contentType: 'text',
    },
    importance: task.importance ? 'high' : 'normal',
  };

  if (task.reminder) {
    T.isReminderOn = true;
    T.reminderDateTime = {
      dateTime: task.reminder,
      timeZone: currentTimeZone(),
    };
  }

  if (task.due) {
    T.dueDateTime = {
      dateTime: task.due,
      timeZone: currentTimeZone(),
    };
  }

  if (debug) console.log('[3] Task:', T);

  return woodpeckerFetch(
    url,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        // Prefer: 'outlook.body-content-type="HTML"',
      },
      body: JSON.stringify(T),
    },
    { timeout: null, debug: config.saveDebugInfo }
  );
}

function currentTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
