require('core-js');
require('regenerator-runtime/runtime');
require('isomorphic-fetch');
const mattermost = require("mattermost-redux/client");

export class MattermostChatProvider implements IChatProvider {
    private client: any;

    constructor(private token: string, private manager: IManager) {
        this.client = mattermost.Client4
        this.client.setUrl('http://localhost:8065'); // Todo move to settings
        this.client.setToken(token)
    }

    public async validateToken(): Promise<CurrentUser | undefined> {
        const me = await this.client.getMe();
        const myTeams: Team[] = await this.client.getMyTeams();
        return {
            id: me.id,
            name: me.username,
            teams: myTeams,
            currentTeamId: undefined, // Will be asked on first log on
            provider: Providers.mattermost
        };
    }

    public async fetchUsers(): Promise<Users> {
        const profiles = await this.client.getProfiles();
        const users: Users = {};

        for (const profile of profiles) {
            const imageUrl = await this.client.getProfilePictureUrl(profile.id);
            const presence = await this.client.getStatus(profile.id);
            const user: User = {
                id: profile.id,
                name: profile.username,
                fullName: profile.first_name + " " + profile.last_name,
                imageUrl,
                smallImageUrl: imageUrl,
                roleName: profile.roles,
                presence
            };

            users[user.id] = user;
        }

        return users;
    }

    public async fetchUserInfo(userId: string): Promise<User | undefined> {
        const user = await this.client.getUser(userId);
        return undefined;
    }

    public async fetchChannels(users: Users): Promise<Channel[]> {
        const currentUser = this.manager.getCurrentUserFor('mattermost')
        const teamId = currentUser ? currentUser.currentTeamId : undefined;
        const channels: Channel[] = [];

        const response = this.client.getMyChannels(teamId);


        response.forEach((channel: any) => {
            channels.push({
                id: channel.id,
                name: channel.name,
                type: ChannelType.channel, // Todo retrieve correct type
                readTimestamp: channel.update_at, // Todo retrieve correct time
                unreadCount: 0 // Todo change to proper number
            })
        });

        return channels;
    }

    public async fetchChannelInfo(channel: Channel): Promise<Channel | undefined> {
        return undefined;
    }

    public async loadChannelHistory(channelId: string): Promise<ChannelMessages> {
        return {};
    }

    public async getUserPreferences(): Promise<UserPreferences | undefined> {
        return undefined;
    }

    public async markChannel(channel: Channel, ts: string): Promise<Channel | undefined> {
        return undefined;
    }

    public async fetchThreadReplies(channelId: string, ts: string): Promise<Message | undefined> {
        return undefined;
    }

    public async sendMessage(text: string, currentUserId: string, channelId: string): Promise<void> {
        return undefined;
    }
    public async sendThreadReply(text: string, currentUserId: string, channelId: string, parentTimestamp: string): Promise<void> {
        return undefined;
    }

    public async connect(): Promise<CurrentUser | undefined> {
        return this.validateToken();
    }

    public isConnected(): boolean {
        return true;
    }

    public async updateSelfPresence(presence: UserPresence, durationInMinutes: number): Promise<UserPresence | undefined> {
        return undefined;
    }

    public subscribePresence(users: Users): void {

    }

    public async createIMChannel(user: User): Promise<Channel | undefined> {
        return undefined;
    }

    public async destroy(): Promise<void> {
        return undefined;
    }
}
