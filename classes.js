class VoiceChat {
    channel_id = "null";
    guild_id = "null";

    constructor(channel_id, guild_id) {
        this.channel_id = channel_id;
        this.guild_id = guild_id;
    }
}

class User {
    avatar = null
    discriminator = null
    id = null
    username = null
    streaming = false
    vc_joined = new VoiceChat()
    last_ss_url = ""
    constructor() {
        this.vc_joined = null
    }
}

module.exports = {
    VoiceChat: VoiceChat,
    User: User
}