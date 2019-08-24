require("core-js");
require("regenerator-runtime/runtime");
require("isomorphic-fetch");

import { customGlobal } from "../types/customGlobal";
declare const global: customGlobal;

if (!global.WebSocket) {
    global.WebSocket = require('ws');
}

const Client4 = require("mattermost-redux/client/client4").default;

import * as rp from "request-promise-native";

export class MattermostChatProvider implements IChatProvider {
    private client: any;
    private wsClient: any;
    private connected: boolean;

    constructor(private token: string, private manager: IManager, private url: string) {
        this.connected = false
        this.client = new Client4
        this.client.setUrl(url);
        this.client.setToken(token)
        this.wsClient = require("mattermost-redux/client/websocket_client.js").default;
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
            // Get the actual image, because retrieving the image via the url requires the API token
            let imageUrl = this.client.getProfilePictureUrl(profile.id);
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
        const imageUrl = this.client.getProfilePictureUrl(userId);
        const presence = await this.client.getStatus(userId);
        return {
            email: user.email,
            fullName: user.first_name + ' ' + user.last_name,
            id: user.id,
            imageUrl,
            name: user.username,
            smallImageUrl: imageUrl,
            presence,
            roleName: user.roles
        };
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
            const post = response.posts[postId]
            const reactions = this.getReactions(post);


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

            // Todo Attachments
            const message: Message = {
                timestamp: post.create_at,
                userId: post.user_id,
                text: post.message,
                isEdited: post.update_at > post.create_at,
                content: undefined,
                reactions: reactions,
                replies: {} // Will be set if parent is detected
            }
            messages[post.create_at] = message
        }
        return messages;
    }

    public async getUserPreferences(): Promise<UserPreferences | undefined> {
        // Not possible to mute single channel
        return undefined;
    }

    public async markChannel(channel: Channel, ts: string): Promise<Channel | undefined> {
        await this.client.viewMyChannel(channel.id, channel.id);
         return undefined;
    }

    public async fetchThreadReplies(channelId: string, ts: string): Promise<Message | undefined> {
        const response = await this.client.getPostsSince(channelId, Number(ts)-1);

        // Get parent post and reactions
        let parentPostId = '';
        for (const postId in response.posts) {
            if (response.posts[postId].create_at === Number(ts)) {
                parentPostId = postId;
            }
        }
        const parentPost = response.posts[parentPostId];
        const reactions = this.getReactions(parentPost);


        // Fetch replies
        const replies: MessageReplies = {};
        for (const postId in response.posts) {
            const currentPost = response.posts[postId];

            if (currentPost.parent_id === parentPostId) {
                replies[currentPost.create_at] = {
                    timestamp: currentPost.create_at,
                    text: currentPost.message,
                    // attachment, Todo
                    userId: currentPost.user_id
                }
            }
        }

        // Build final message with replies
        const message: Message = {
            timestamp: parentPost.create_at,
            userId: parentPost.user_id,
            text: parentPost.message,
            isEdited: parentPost.update_at > parentPost.create_at,
            //textHTML
            content: undefined,
            reactions: reactions,
            replies
        }
        return message;
    }

    public async sendMessage(text: string, currentUserId: string, channelId: string): Promise<void> {
        const post = {
            message: text,
            channel_id: channelId
        }
        // Todo check how to attach files
        return this.client.createPost(post);
    }

    public async sendThreadReply(text: string, currentUserId: string, channelId: string, parentTimestamp: string): Promise<void> {
        const response = await this.client.getPostsSince(channelId, Number(parentTimestamp)-1);

        // Get parent post and reactions
        let parentPostId = undefined;
        for (const postId in response.posts) {
            if (response.posts[postId].create_at === Number(parentTimestamp)) {
                parentPostId = postId;
            }
        }
        const post = {
            message: text,
            channel_id: channelId,
            root_id: parentPostId
        }
        // Todo check how to attach files
        return this.client.createPost(post);
    }

    public async connect(): Promise<CurrentUser | undefined> {
        this.wsClient.setFirstConnectCallback(()=>{
            this.connected = true;
        });

        this.wsClient.setReconnectCallback(()=>{
            this.connected = true;
        });

        this.wsClient.setErrorCallback(()=>{
            this.connected = false;
        });

        this.wsClient.setCloseCallback(()=>{
            this.connected = false;
        });

        await this.wsClient.initialize(this.token, { connectionUrl: `${this.url}/api/v4/websocket` });

        return this.validateToken();
    }

    public isConnected(): boolean {
        return this.connected;
    }

    public async updateSelfPresence(presence: UserPresence, durationInMinutes: number): Promise<UserPresence | undefined> {
        return undefined;
    }

    public subscribePresence(users: Users): void {
        this.wsClient.setEventCallback(function (event: any) {
            console.log(event);
        });

    }

    public async createIMChannel(user: User): Promise<Channel | undefined> {
        return undefined;
    }

    public async destroy(): Promise<void> {
        return this.wsClient.close();
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

    public async getProfileImage(url: string): Promise<string> {
        // This is not implemented in the Client4 yet.
        const response = await rp.get(url, {
            headers: {
              Authorization: `BEARER ${this.token}`
            },
            encoding: null
          });
        const image = 'data:image/png;base64,' + Buffer.from(response).toString('base64');
        return image;
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

    /**
     * Get the reactions for the given post
     * @param post The post retrieved from the mattermost API client.
     */
    private getReactions(post: any): MessageReaction[] {
        const reactions: MessageReaction[] = []

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

        return reactions;
    }
}
