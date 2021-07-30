const fetch = require("node-fetch")
const discord = require("./client")
const SaveManager = new (require("./save_manager"))()
const {VoiceChat, User} = require("./classes")

const token = process.env.discord_token;

let Users = {"": new User()};
Users = {};

let user_info = null

const dc = new discord(token, "wss://gateway.discord.gg/?encoding=etf&v=9&compress=zlib-stream", packet => {
    if (packet.t == "VOICE_STATE_UPDATE") {
        try {
            if (packet.d.member == undefined)
                return;

            let user = Users[packet.d.member.user.id];
            if (user == undefined) {
                user = Object.create(User.prototype, Object.getOwnPropertyDescriptors(packet.d.member.user))
                Users[user.id] = user;
                console.log(`Discovered person ${user.username}#${user.discriminator} (${user.id})`)
            }

            if (packet.d.channel_id != undefined) {
                if (user.vc_joined == null) {
                    console.log(`User join ${user.username}#${user.discriminator} (${user.id})`);
                    user.vc_joined = new VoiceChat(packet.d.channel_id, packet.d.guild_id)
                }
            } else {
                console.log(`User leave ${user.username}#${user.discriminator} (${user.id})`);
                user.vc_joined = null
                packet.d.self_stream = false
            }

            if (packet.d.self_stream) {
                if (!user.streaming) {
                    console.log(`Stream start ${user.username}#${user.discriminator} (${user.id})`);
                    user.streaming = true;
                }
            } else if (user.streaming) {
                console.log(`Stream end ${user.username}#${user.discriminator} (${user.id})`);
                user.streaming = false;
            }
        } catch (error) {
            console.log(error)
            console.log(JSON.stringify(packet.d))
        }
    } else if (packet.t == "READY") {
        user_info = packet.d.users
    } else if (packet.t == "READY_SUPPLEMENTAL") {
        for (const guild of packet.d.guilds) {
            for (const vc_user of guild.voice_states) {
                let user
                for (const u of user_info) {
                    if (u.id == vc_user.user_id) {
                        user = Object.create(User.prototype, Object.getOwnPropertyDescriptors(u))
                        break
                    }
                }
                if (!user) {
                    user = new User();
                    user.id = vc_user.user_id
                }

                user.streaming = vc_user.self_stream
                user.vc_joined = new VoiceChat(vc_user.channel_id, guild.id)

                Users[user.id] = user;
            }
        }
        console.log(`Loaded ${Object.keys(Users).length} people from READY_SUPPLEMENTAL packet`)
        delete user_info
    }
});

(async () => {
    while (1) {
        for (const i in Users) {
            try {
                let user = Users[i];
                if (user.streaming) {
                    await new Promise(res=>setTimeout(res, 1000))
                    let res = await fetch(`https://discord.com/api/v9/streams/guild:${user.vc_joined.guild_id}:${user.vc_joined.channel_id}:${user.id}/preview`, {
                        headers: {
                            "authorization": token
                        }
                    });
                    if (res.status != 200) {
                        if (res.status == 429)
                            console.log("Ratelimited bruh")
                        else if (res.status == 401)
                            console.log(`User ${user.username}#${user.discriminator} (${user.id}) is in hidden channel`)
                        else
                            console.log("Unkown res code " + res.status + "\n" + await res.text());
                        continue
                    }
                    let j = await res.json()
                    if (user.last_ss_url != j.url) {
                        user.last_ss_url = j.url;
                        console.log(`New preview URL for ${user.username}#${user.discriminator} (${user.id})s stream`);
                        let img_res = await fetch(user.last_ss_url);
                        let img = await img_res.buffer();
                        SaveManager.Save(user, user.last_ss_url.split("/").pop(), img);
                    }
                }
            } catch (error) {
                console.log(error)
            }
        }
        await new Promise(res=>setTimeout(res, 20000))
    }
})();

dc.connect();