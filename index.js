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

    this.client.on("ready", c => console.info(`Logged in as ${c.user.tag}`))
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

    msczFiles.forEach(file => {
      console.debug(`Processing file ${file.name}`)
      const data = file.attachment.buffer
      const baseFileName = file.name.slice(0, file.name.lastIndexOf("."))

      this.converter.convert(data, ["wav", "pdf"]).then(outputFiles => {
        message.reply({
          files: outputFiles.map((extension, data) =>
            new discord.MessageAttachment(data, `${baseFileName}.${extension}`))
        })
      }).catch(reason => {
        message.reply(reason)
        console.warn(reason)
      })
    })
  }
}

const bot = new MusescoreBot()
