import * as discord from "discord.js"
import * as path from "node:path"

import {MuseConverter} from "./convert.js"

const Intents = discord.Intents

class MusescoreBot {
  static MS_EXEC_PATH = "bin/mscore"
  static MS_RUN_DIR = "run"

  constructor() {
    this.client = new discord.Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]})
    this.converter = new MuseConverter(path.resolve(MusescoreBot.MS_EXEC_PATH), MusescoreBot.MS_RUN_DIR)

    this.client.on("ready", c => console.log(`Logged in as ${c.user.tag}`))
    this.client.on("messageCreate", this.handleMessage)

    this.client.login()
  }

  handleMessage(message) {
    console.debug(`Recieved message ${message}`)

    const msczFiles = message.attachments.filter(attachment => attachment.name.endsWith("mscz"))
    if (!msczFiles) { return }

    let wavAttachments = []
    let pdfAttachments = []
    let errorMessages = []

    for (file in msczFiles) {
      const data = file.attachment.buffer
      converter.convert(data, "wav").then(wavData => {
        wavAttachments.push(new discord.MessageAttachment(wavData))
      }).catch(reason => {
        errorMessages.push(`Could not convert ${file.name} to wav: ${reason}`)
      })
      converter.convert(data, "pdf").then(pdfData => {
        pdfAttachments.push(new discord.MessageAttachment(pdfData))
      }).catch(reason => {
        errorMessages.push(`Could not convert ${file.name} to pdf: ${reason}`)
      })
    }

    let result = new discord.Message(this.client)
    result.attachments = wavAttachments.concat(pdfAttachments)
    result.content = errorMessages.join("\n")

    message.reply(result)
  }
}

const bot = new MusescoreBot()
