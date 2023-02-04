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
    const msczFiles = message.attachments.filter(attachment => attachment.name.endsWith("mscz"))
    if (msczFiles.size == 0) { return }

    console.debug(`Recieved message "${message}" with ${msczFiles.size} MuseScore (mscz) file(s).`)

    let wavAttachments = []
    let pdfAttachments = []
    let errorMessages = []

    for (file in msczFiles) {
      const data = file.attachment.buffer
      const baseFileName = file.name.slice(0, file.name.lastIndexOf("."))
      converter.convert(data, "wav").then(wavData => {
        console.debug(`Converted ${file.name} to wav.`)
        wavAttachments.push(new discord.MessageAttachment(wavData, baseFileName + ".wav"))
      }).catch(reason => {
        console.warn(`Could not convert ${file.name} to wav: ${reason}`)
        errorMessages.push(`Could not convert ${file.name} to wav: ${reason}`)
      })
      converter.convert(data, "pdf").then(pdfData => {
        console.debug(`Converted ${file.name} to pdf`)
        pdfAttachments.push(new discord.MessageAttachment(pdfData, baseFileName + ".pdf"))
      }).catch(reason => {
        console.warn(`Could not convert ${file.name} to pdf: ${reason}`)
        errorMessages.push(`Could not convert ${file.name} to pdf: ${reason}`)
      })
    }

    message.reply({
      body: errorMessages.join("\n"),
      files: wavAttachments.concat(pdfAttachments)
    })
  }
}

const bot = new MusescoreBot()
