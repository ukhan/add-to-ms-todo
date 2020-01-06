import { getToken } from './auth';
import { get as getConfig } from './config';
import { t } from './i18n';
import getTabInfo from './tab';
import notification from './notification';

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

        resolve(response && 'folders' in response ? response.folders : []);
      }
    );
  }).catch(message => notification(message));
}

export async function bgGetFolders(access_token) {
  let url = `${baseUrl}/taskfolders`;

  return fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw response.statusText ||
          `Error ${response.status} occurred while get lists of tasks.`;
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
    .catch(err => notification(err));
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
        notification(t('SuccessNotification'));
      }
    })
    .catch(res => {
      let err =
        this.t('ErrorNotification') +
        ' – \n' +
        (res.statusText || `#${res.status}`);
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
      }
    };

  if (task.reminder) {
    T.IsReminderOn = true;
    T.ReminderDateTime = {
      DateTime: task.reminder,
      TimeZone: currentTimeZone()
    };
  }

  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(T)
  }).then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw { status: response.status, statusText: response.statusText };
    }
  });
}

function currentTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
