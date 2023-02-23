import * as discord from "discord.js"
import * as fs from "node:fs/promises"
import * as os from "node:os"
import * as path from "node:path"

import {MuseConverter} from "./convert.js"


class MusescoreBot {
  static MS_EXEC_PATH = process.env.MSCORE_PATH ?? path.resolve("bin/mscore")
  static MS_RUN_DIR = os.tmpdir()

  constructor() {
    this.client = new discord.Client({intents: [
      discord.GatewayIntentBits.Guilds,
      discord.GatewayIntentBits.GuildMessages,
      discord.GatewayIntentBits.MessageContent,
      discord.GatewayIntentBits.GuildMessageReactions
    ]})
    this.converter = null
  }

  init() {
    MuseConverter.create(MusescoreBot.MS_EXEC_PATH, MusescoreBot.MS_RUN_DIR).then(conv => {
      this.converter = conv
    })

    this.client.on("ready", c => console.info(`Logged in as ${c.user.tag}`))
    this.client.on("messageCreate", this.handleMessage.bind(this))

    this.client.login()
  }

  handleMessage(message) {
    const msczFiles = message.attachments.filter(attachment => attachment.name.endsWith("mscz"))
    if (msczFiles.size == 0) { return }

    console.debug(`Recieved message "${message}" with ${msczFiles.size} MuseScore (mscz) file(s).`)

    if (!this.converter) {
      console.info(`Converter not ready: ${this.converter}`)
      return
    }

    while (!this.converter.available) {}

    msczFiles.forEach(file => {
      console.debug(`Processing file ${file.name}`)
      const data = file.attachment.buffer
      const baseFileName = file.name.slice(0, file.name.lastIndexOf("."))

      fetch(file.attachment).then(res =>
        this.converter.convert(res.body, ["wav", "pdf"])
      ).then(outputFiles => message.reply({
        files: outputFiles.map((outputData, extension) =>
          new discord.MessageAttachment(data, `${baseFileName}.${extension}`))
      })).catch(reason => {
        message.reply(reason).catch(console.error)
        console.warn(reason)
      })
    })
  }
}

const bot = new MusescoreBot()
bot.init()
