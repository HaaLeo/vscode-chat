
require('core-js');
require('regenerator-runtime/runtime');
require('isomorphic-fetch');
const mattermost = require("mattermost-redux/client");
// import {Client4} from 'mattermost-redux/client/client4';
export class MattermostChatProvider implements IChatProvider {
    private client: any;

    constructor(private token: string, private manager: IManager) {
        this.client = mattermost.Client4
        this.client.setUrl('http://localhost:8065');
        this.client.setToken(token)
    }

    async validateToken(): Promise<CurrentUser | undefined> {

        const me = await this.client.getUserByUsername('me');
        return {
            id: 'user_id',
            name: 'user',
            teams: [{ id: 'team_id', name: 'team' }],
            currentTeamId: 'team_id',
            provider: Providers.mattermost
        };
    }
    fetchUsers: () => Promise<Users>;
    fetchUserInfo: (userId: string) => Promise<User | undefined>;
    fetchChannels: (users: Users) => Promise<Channel[]>;
    fetchChannelInfo: (channel: Channel) => Promise<Channel | undefined>;
    loadChannelHistory: (channelId: string) => Promise<ChannelMessages>;
    getUserPreferences: () => Promise<UserPreferences | undefined>;
    markChannel: (channel: Channel, ts: string) => Promise<Channel | undefined>;
    fetchThreadReplies: (channelId: string, ts: string) => Promise<Message | undefined>;
    sendMessage: (text: string, currentUserId: string, channelId: string) => Promise<void>;
    sendThreadReply: (text: string, currentUserId: string, channelId: string, parentTimestamp: string) => Promise<void>;
    connect: () => Promise<CurrentUser | undefined>;
    isConnected: () => boolean;
    updateSelfPresence: (presence: UserPresence, durationInMinutes: number) => Promise<UserPresence | undefined>;
    subscribePresence: (users: Users) => void;
    createIMChannel: (user: User) => Promise<Channel | undefined>;
    destroy: () => Promise<void>;

}
