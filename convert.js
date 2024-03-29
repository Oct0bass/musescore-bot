import * as discord from "discord.js"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import {exec as _exec} from "node:child_process"
import {promisify} from "node:util"

const exec = promisify(_exec)

export class MuseConverter {
  constructor(executable, workingDir) {
    this.executable = executable
    this.workingDir = workingDir
    this.available = true
  }

  static create(executable, rootDir) {
    return fs.mkdtemp(path.join(rootDir, "converter-")).then(tempDir => {
      console.debug(`Created converter at ${tempDir} using ${executable}`)
      return new MuseConverter(executable, tempDir)
    })
  }

  convert(data, types, inputType = "mscz") {
    const inputFilePath = path.resolve(this.workingDir, `input.${inputType}`)
    const outputFilePaths = types.map(type => path.resolve(this.workingDir, `output.${type}`))
    const conversionJobPath = path.resolve(this.workingDir, "job.json")

    this.available = false

    const job = JSON.stringify([{
      in: inputFilePath,
      out: outputFilePaths
    }])
    const command = `"${this.executable}" -j "${conversionJobPath}"`

    return Promise.all([
      fs.writeFile(inputFilePath, data),
      fs.writeFile(conversionJobPath, job)
    ]).then(_ => {
      console.debug(`converter @ ${this.workingDir}> ${command}`)
      return exec(command)
    }).then(({stdout, stderr}) => {
      const logPrefix = `${path.basename(this.workingDir)}: ${path.basename(this.executable)}: `
      if (stdout) {
        console.debug(logPrefix + stdout)
      }
      if (stderr) {
        console.warn(logPrefix + stderr)
      }
      return Promise.all(outputFilePaths.map(file => fs.readFile(file)))
    }).then(buffers => {
      let result = new discord.Collection()
      buffers.forEach((buffer, i) => {
        result.set(types[i], buffer)
      })
      return result
    }).finally(_ => this.available = true)
  }
}
