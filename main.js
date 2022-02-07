const discord = require("discord.js")
const client = new discord.Client({intents: 2147609664})

client.on("messageCreate", message => {
  let msczFiles = message.attachments.filter(attachment => attachment.name.endsWith("mscz"))
  for (file in msczFiles) {
//...
  }
})

client.channels.cache.filter(channel => channel.type = GUILD_TEXT).foreach(channel => {
  channel.awaitMessages({filter: message => message.content == "test"}).then(messages => {
    channel.send("test").catch(console.error)
  }).catch(console.error)
})

client.login(client.token)
