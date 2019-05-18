# Mattermost Setup

To setup vscode-chat for mattermost you can choose one of the following authentication mechanisms

## Server URL

To configure you mattermost server's URL run the command _Update Mattermost Sever URL_ and insert the URL (E.g. `http://localhost:8065`)

## Personal Access Token

### Obtain Token

To set up Mattermost inside VS Code, you need to have your _personal access token_ for mattermost. To obtain your token, follow the steps [given here](https://docs.mattermost.com/developer/personal-access-tokens.html#creating-a-personal-access-token).

### Configure Token

Once you have the token, run the following commands from the VS Code command palette:

1. Run **Chat: Configure Access Token**, select "Mattermost", and then paste your token in the input box

> Your token will be saved securely in your system's local keychain.

2. Next, you will be prompted to choose your primary Mattermost team. If you don't want to select now, you can run the **Chat: Change Workspace** command later.

### Troubleshooting

For any support or suggestions, please [create an issue](https://github.com/karigari/vscode-chat/issues).
