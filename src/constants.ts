export const CONFIG_ROOT = "chat";
export const EXTENSION_ID = "karigari.chat";
export const OUTPUT_CHANNEL_NAME = "Team Chat";
export const CONFIG_AUTO_LAUNCH = "chat.autoLaunchLiveShareChat";

// Is there a way to get this url from the vsls extension?
export const LIVE_SHARE_BASE_URL = `insiders.liveshare.vsengsaas.visualstudio.com`;
export const VSLS_EXTENSION_ID = `ms-vsliveshare.vsliveshare`;
export const VSLS_EXTENSION_PACK_ID = `ms-vsliveshare.vsliveshare-pack`;

export const LiveShareCommands = {
  START: "liveshare.start",
  END: "liveshare.end",
  JOIN: "liveshare.join"
};

export const VSCodeCommands = {
  OPEN: "vscode.open",
  OPEN_SETTINGS: "workbench.action.openSettings"
};

export const SelfCommands = {
  OPEN_WEBVIEW: "extension.chat.openChatPanel",
  CHANGE_WORKSPACE: "extension.chat.changeWorkspace",
  CHANGE_CHANNEL: "extension.chat.changeChannel",
  SIGN_IN: "extension.chat.authenticate",
  SIGN_OUT: "extension.chat.signout",
  CONFIGURE_TOKEN: "extension.chat.configureToken",
  LIVE_SHARE_FROM_MENU: "extension.chat.startLiveShare",
  LIVE_SHARE_SLASH: "extension.chat.slashLiveShare",
  LIVE_SHARE_SESSION_CHANGED: "extension.chat.vslsSessionChanged",
  RESET_STORE: "extension.chat.reset",
  SETUP_NEW_PROVIDER: "extension.chat.setupNewProvider",
  FETCH_REPLIES: "extension.chat.fetchReplies",
  UPDATE_MESSAGES: "extension.chat.updateMessages",
  UPDATE_MESSAGE_REPLIES: "extension.chat.updateReplies",
  UPDATE_PRESENCE_STATUSES: "extension.chat.updatePresenceStatuses",
  UPDATE_SELF_PRESENCE: "extension.chat.updateSelfPresence",
  UPDATE_SELF_PRESENCE_VIA_VSLS: "extension.chat.updateSelfPresenceVsls",
  CHAT_WITH_VSLS_CONTACT: "extension.chat.startChatWithVslsContact",
  ADD_MESSAGE_REACTION: "extension.chat.addMessageReaction",
  REMOVE_MESSAGE_REACTION: "extension.chat.removeMessageReaction",
  SEND_MESSAGE: "extension.chat.sendMessage",
  SEND_THREAD_REPLY: "extension.chat.sendThreadReply",
  CHANNEL_MARKED: "extension.chat.updateChannelMark",
  HANDLE_INCOMING_LINKS: "extension.chat.handleIncomingLinks",
  SEND_TO_WEBVIEW: "extension.chat.sendToWebview"
};

export const SLASH_COMMANDS: any = {
  live: {
    share: {
      action: LiveShareCommands.START,
      options: { suppressNotification: true }
    },
    end: { action: LiveShareCommands.END, options: {} }
  }
};

// Reverse commands are acted on when received from Slack
export const REVERSE_SLASH_COMMANDS = {
  live: {
    request: {}
  }
};

// Internal uri schemes
export const TRAVIS_BASE_URL = `travis-ci.org`;
export const TRAVIS_SCHEME = "chat-travis-ci";

// Slack App
export const SLACK_OAUTH = `https://slack.com/oauth/authorize?scope=client&client_id=282186700213.419156835749`;

// Discord
const DISCORD_SCOPES = ["identify", "rpc.api", "messages.read", "guilds"];
const DISCORD_SCOPE_STRING = DISCORD_SCOPES.join("%20");
const DISCORD_CLIENT_ID = "486416707951394817";
export const DISCORD_OAUTH = `https://discordapp.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=code&scope=${DISCORD_SCOPE_STRING}`;

// Mattermost
export const MATTERMOST_OAUTH = 'http://localhost:8065/oauth/authorize?client_id=78qtzgqeztfu9xi5u3wa9g9cfw&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fmattermost_redirect';

// Telemetry
export const MIXPANEL_TOKEN = "14c9fea2bf4e06ba766e16eca1bce728";
