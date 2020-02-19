import { getToken } from './auth';
import { get as getConfig } from './config';
import { t } from './i18n';
import getTabInfo from './tab';
import { notification, closeNotification } from './notification';
import { woodpeckerFetch } from './fetch';

const baseUrl = 'https://outlook.office.com/api/v2.0/me';

export async function getFolders() {
  let access_token = await getToken();

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'GET_FOLDERS', access_token },
      response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        }

        let folders = response && 'folders' in response ? response.folders : [];
        chrome.storage.local.set({ folders });
        resolve(folders);
      }
    );
  }).catch(message => notification(message));
}

export async function bgGetFolders(access_token) {
  let url = `${baseUrl}/taskfolders?top=100`; // FIXME

  return woodpeckerFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(folders => {
      return folders.value.map(folder => {
        return {
          id: folder.Id,
          label: folder.Name,
          isDefault: folder.IsDefaultFolder
        };
      });
    })
    .catch(res => {
      let err =
        t('GetListsError') + ' – \n' + (res.statusText || `#${res.status}`);
      notification(err);
    });
}

export async function quickAddTask() {
  let config = await getConfig();
  let access_token = await getToken(false, true);
  let tabInfo = await getTabInfo();
  let task = {
    title: tabInfo.title,
    description: tabInfo.selected.trim().length
      ? `${tabInfo.selected}\n\n ${tabInfo.url}`
      : tabInfo.url
  };
  return bgAddTask(access_token, task)
    .then(() => {
      if (config.notifyOnSuccess) {
        notification(t('SuccessNotification')).then(id =>
          closeNotification(id)
        );
      }
    })
    .catch(res => {
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
      res => {
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
  let url =
      'list' in task
        ? `${baseUrl}/taskfolders('${task.list}')/tasks`
        : `${baseUrl}/tasks`,
    T = {
      Subject: task.title,
      Body: {
        Content: task.description,
        ContentType: 'Text'
      },
      Importance: task.importance ? 'High' : 'Normal'
    };

  if (task.reminder) {
    T.IsReminderOn = true;
    T.ReminderDateTime = {
      DateTime: task.reminder,
      TimeZone: currentTimeZone()
    };
  }

  return woodpeckerFetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(T)
  });
}

function currentTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
