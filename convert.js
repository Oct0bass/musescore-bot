import * as fs from "node:fs/promises"
import * as process from "node:process"
import {exec} from "node:child_process"

class MuseConverter {
  constructor(executable, workingDir) {
    this.executable = executable
    fs.mkdir(workingDir, {recursive: true}).catch(error => {
      if (error && error.code !== "EEXIST") {
        throw error
      }
    })
    process.chdir(workingDir)
  }

  convert(data, type) {
    const inputFileName = "input.mscz"
    const outputFileName = `output.${type}`
    return new Promise((resolve, reject) => {
      fs.open(inputFileName, "wt").then(file => {
        file.write(data)
        file.close()
      }).catch(reason => reject(reason))
      const command = `${this.executable} ${inputFileName} -o ${outputFileName}`
      exec(command, (err, stdout, stderr) => {
        if (err) {
          reject(stderr)
        }
      })
      fs.open(outputFileName).then(file => {
        file.read().then(outputData => resolve(outputData)).catch(reason => reject(reason))
      }).catch(reason => reject(reason))
    })
  }
}
