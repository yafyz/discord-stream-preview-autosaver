const fs = require("fs")

class SaveManager {
    constructor() {
        if (!fs.existsSync("saved")) {
            fs.mkdirSync("saved")
        }
    }

    Save(user, hash, img) {
        if (!fs.existsSync(`saved/${user.id}`))
            fs.mkdirSync(`saved/${user.id}`);
        if (!fs.existsSync(`saved/${user.id}/${user.vc_joined.guild_id}`))
            fs.mkdirSync(`saved/${user.id}/${user.vc_joined.guild_id}`);
        if (!fs.existsSync(`saved/${user.id}/${user.vc_joined.guild_id}/${user.vc_joined.channel_id}`))
            fs.mkdirSync(`saved/${user.id}/${user.vc_joined.guild_id}/${user.vc_joined.channel_id}`);

        fs.writeFileSync(`saved/${user.id}/${user.vc_joined.guild_id}/${user.vc_joined.channel_id}/${hash}.jpeg`, img);
    }
}

module.exports = SaveManager