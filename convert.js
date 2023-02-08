import * as fs from "node:fs/promises"
import * as process from "node:process"
import * as path from "node:path"
import {exec} from "node:child_process"

export class MuseConverter {
  constructor(executable, workingDir) {
    this.executable = executable
    fs.mkdir(workingDir, {recursive: true}).catch(error => {
      if (error && error.code !== "EEXIST") {
        throw error
      }
    })
  }

  convert(data, types, inputType = "mscz") {
    const inputFilePath = path.resolve(this.workingDir, `input.${inputType}`)
    const outputFilePaths = types.map(type => path.resolve(this.workingDir, `output.${type}`))
    const conversionJobPath = path.resolve(this.workingDir, "job.json")

    const job = JSON.stringify([{
      in: inputFilePath,
      out: outputFilePaths
    }])
    const command = `${this.executable} ${inputFilePath} -j ${conversionJobPath}`

    return new Promise((resolve, reject) => {
      fs.open(inputFilePath, "wt").then(file => {
        file.write(data)
        file.close()
      }).catch(reason => reject(`Could not write input file: ${reason}`))
      fs.open(conversionJobPath, "wt").then(file => {
        file.write(job)
        file.close()
      }).catch(reason => reject(`Could not write conversion job file: ${reason}`))
      console.debug(`converter @ ${this.workingDir}> ${command}`)
      exec(command, (err, stdout, stderr) => {
        if (err) {
          reject(`Command ${command} failed with code ${err}: ${stderr}`)
        }
      })
      let result = new Map()
      for (const outputFile in outputFilePaths) {
        fs.open(outputFile).then(file => {
          file.read().then(buf => {
            result.set(outputFile.slice(outputFile.lastIndexOf(".")), buf)
          }).catch(reason => `Could not read output file ${outputFile}: ${reason}`)
        })
      }
      resolve(result)
    })
  }
}
