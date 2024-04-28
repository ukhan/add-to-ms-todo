# Release Notes

## v0.21.0 (2024-05-21)

- [MV3](https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline) migration.
- [Microsoft Graph To Do API](https://learn.microsoft.com/en-us/graph/api/resources/todo-overview) migration.

## v0.20.0 (2021-07-04)

- The extension icon has been changed.

## v0.19.8 (2021-03-08)

- Fixed run Quick Add command by shortcut.
- Autofocus for Task Title.

## v0.19.7 (2021-02-06)

- Fixed a bug that caused the task due date to be incorrect.

## v0.19.6 (2020-10-19)

- Restored access to the text selected on the page.

## v0.19.5 (2020-10-17)

- URLs for Edge context menu.

## v0.19.4 (2020-10-15)

- Full Page Options (Edge's embedded settings are pretty bad).

## v0.19.3 (2020-10-14)

- Fixed a bug that occurred if, at the time of authentication, only one tab remained open.

## v0.19.2 (2020-10-04)

- Fixed the error that occurs when a long enough time between the start of the authentication process and its completion.

## v0.19.1 (2020-09-28)

- Increased time before auth tab activation.

## v0.19.0 (2020-09-27)

- You will no longer have to enter your username and password if more than 24 hours have passed since the last use of the extension, and the browser has restarted. You can read in more detail why this was happening [here](http://bit.ly/24h-issue). Because it is impossible to use the standard browser functionality with the Microsoft API, the extension will need additional "Read your browsing history" permissions. It is necessary so that the extension can authenticate the user in a separate browser tab.
  - [RU] Больше не придется вводить логин и пароль, если с момента последнего использования расширения прошло больше 24 часов и браузер был перезапущен. Почему так происходило подробней можно почитать [здесь](http://bit.ly/24h-issue). Из-за того, что с Microsoft API невозможно использовать штатный функционал браузера, расширению потребуется дополнительные полномочия "Читать историю просмотров". Это нужно чтобы расширение могло произвести аутентификацию пользователя в отдельной вкладке браузера.

## v0.18.0 (2020-09-21)

- Added the ability to toggle the state of the form (blank/filled).
- Added a setting that allows setting the initial state of the form.

## v0.17.2 (2020-09-01)

- It looks like refresh_token lives less than 24 hours ...

## v0.17.1 (2020-08-31)

- Re-authentication using cookies when the 24-hour refresh_token lifetime ends.

## v0.17.0 (2020-08-25)

- Support for Azure AD accounts.

## v0.16.1 (2020-08-13)

- Fixed an error that didn't save the last used list.

## v0.16.0 (2020-08-11)

- Customized "Quick add" in the contextual menu.

## v0.15.0 (2020-06-03)

- Dark theme.

## v0.14.1 (2020-05-27)

- The URL of the To Do web application in the context menu has been fixed.

## v0.14.0 (2020-05-11)

- Saving the changes made to the task information and restoring them
  the next time the extension is called for the same page.

## v0.13.0 (2020-04-25)

- Added Due Date (deactivated by default).
- It is now possible to enable and disable the use of Reminder Date and Due Date.

## A long time ago in a galaxy far, far away….

What happened there can be found only by the commits.
