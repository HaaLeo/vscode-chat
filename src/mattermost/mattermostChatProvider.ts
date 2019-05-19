require("core-js");
require("regenerator-runtime/runtime");
require("isomorphic-fetch");

import {customGlobal} from "../types/customGlobal";
declare const global: customGlobal;

if (!global.WebSocket) {
    global.WebSocket = require('ws');
}

const Client4 = require("mattermost-redux/client/client4").default;

export class MattermostChatProvider implements IChatProvider {
    private client: any;
    private wsClient: any;

    constructor(private token: string, private manager: IManager, private url: string) {
        this.client = new Client4
        this.client.setUrl(url);
        this.client.setToken(token)
        this.wsClient = require("mattermost-redux/client/websocket_client.js").default;
        this.wsClient.setEventCallback(function (event: any) {
            console.log(event);
        });
        this.wsClient.initialize(token, {connectionUrl: `${url}/api/v4/websocket`});
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
        const currentUser = this.manager.getCurrentUserFor("mattermost")
        const teamId = currentUser ? currentUser.currentTeamId : undefined;

        const response: any[] = await this.client.getMyChannels(teamId);

        const channels = await this.convertChannels(response, users);

        return channels;
    }

    public async fetchChannelInfo(channel: Channel): Promise<Channel | undefined> {
        const response = await this.client.getChannel(channel.id);

        const updatedChannel = await this.convertChannels([response]);

        return updatedChannel[0];
    }

    public async loadChannelHistory(channelId: string): Promise<ChannelMessages> {
        const response = await this.client.getPosts(channelId);
        const messages: ChannelMessages = {};



        for (const postId in response.posts) {
            const reactions: MessageReaction[] = []
            const post = response.posts[postId]

            // Get reactions
            if (post.has_reactions) {
                post.metadata.reactions.forEach((reaction: any) => {
                    const foundReaction = reactions.find(({ name }) => {
                        return name === reaction.emoji_name ? reaction : undefined;
                    });

                    if (foundReaction) {
                        // Update reaction if it already exists
                        foundReaction.count += 1;
                        foundReaction.userIds.push(reaction.user_id)

                    } else {
                        // Add new entry to list
                        reactions.push({
                            count: 1,
                            name: `:${reaction.emoji_name}:`,
                            userIds: [reaction.user_id]
                        })
                    }
                });
            }

            // This post is a reply to another post
            if (post.parent_id) {
                const parentPost = response.posts[post.parent_id];
                const parentMessage = messages[parentPost.create_at];
                parentMessage.replies[post.create_at] = {
                    timestamp: post.create_at,
                    text: post.message,
                    // attachment, Todo
                    // textHTML,
                    userId: post.user_id
                }
            }
            // interface Message {
            //     timestamp: string;
            //     userId: string;
            //     text: string;
            //     textHTML?: string;
            //     isEdited?: Boolean;
            //     attachment?: MessageAttachment;
            //     content: MessageContent | undefined;
            //     reactions: MessageReaction[];
            //     replies: MessageReplies;

            // Todo Attachments
            const message: Message = {
                timestamp: post.create_at,
                userId: post.user_id,
                text: post.message,
                isEdited: post.update_at > post.create_at,
                //textHTML
                content: undefined,
                reactions: reactions,
                replies: {} // Will be set if parent is detected
            }
            messages[post.create_at] = message
        }
        return messages;
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

    /**
     * Retrieve unread messages for a channel.
     * @param channelId The channel id.
     */
    private async getUnreadsForChannel(channelId: string): Promise<any> {
        // This is not implemented in the Client4 yet.
        return this.client.doFetch(
            `${this.client.getUserRoute('me')}/channels/${channelId}/unread`,
            { method: 'get' })
    }

    /**
     * Convert the via the client retrieved channel to the Channels interface.
     * @param channels An array of channels, retrieved via the client
     * @returns {array} The converted channels
     */
    private async convertChannels(channels: any[], users?: Users): Promise<Channel[]> {
        const result: Channel[] = [];

        if (!users) {
            users = await this.fetchUsers();
        };

        for (const channel of channels) {
            let type: ChannelType;
            let name = channel.name;
            const unreads = await this.getUnreadsForChannel(channel.id);
            const unreadCount = unreads.msg_count;

            switch (channel.type) {
                case "D":
                    type = ChannelType.im;

                    // If channel is a direct message we need to resolve the name
                    // Name has structure "otherId__myId"
                    const otherUserId = channel.name.split("__", 2)[0];
                    name = users[otherUserId].name;
                    break;
                case "P":
                    // Private Channel
                    type = ChannelType.group;
                    break;
                case "O":
                default:
                    // Public channel
                    type = ChannelType.channel;
                    break;
            }

            result.push({
                id: channel.id,
                name,
                type,
                readTimestamp: channel.update_at, // Todo retrieve correct time
                unreadCount
            })
        }

        return result;
    }
}
