const readline = require("readline");
const path = require('path');
const fs = require('fs');
const {execFileSync} = require('child_process')
const os = require('os')

const targets = ['echo ','exit ']

let tabCount = 0 
let lastLine = ''
//______ idea = completer is a func that can detect tab + do something
//_________ to check exec, just append files + directories + call accessSync
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
  completer: function(line){

        let hits = targets.filter(target=>target.startsWith(line))
        const normLine = normalize(line)
        const target
        const dirNames = process.env.PATH.split(':')
        
        
        for(const dir of dirNames){
          try{
            const files = fs.readdirSync(dir)
            for (const fileName of files){
              const fullPath = path.join(dir, fileName)
              try{
                fs.accessSync(fullPath, fs.constants.X_OK)
                fileName.startsWith(line) && hits.push(`${fileName} `)
              }
              catch(e){
                continue  
              } 
            }
          }
          catch(error){
              continue
          }  // cases are with / check if directory or file
        } //  end of for loop, checking all executables

        //__________________________EXPLICITLY IF COMMAND ________________________________________________
        if(line.includes(' ') && normLine.at(-1).includes('/')){ //  this check won't work anymore

          let inputDir = ''
          const prevInput = normLine.slice(0,-1).join(' ')
          const inputPath = normLine.at(-1)
          const maxIndex = Math.max(inputPath.lastIndexOf('/'), inputPath.lastIndexOf('\\'))
          let input = inputPath.substring(maxIndex+1)
          maxIndex===0 ? inputDir = '/': inputDir = inputPath.slice(0,maxIndex)
          const dirFiles = fs.readdirSync(inputDir)


          if(dirFiles.length===1){ //  could be a directory or file
            const fullPath = path.join(inputDir, dirFiles[0])
            fs.statSync(fullPath).isDirectory() ? hits.push(`${prevInput} ${fullPath}/`)
            : hits.push(`${prevInput} ${fullPath} `)
          }
          else{
            for(dirFile of dirFiles){
              if(dirFile.startsWith(input)){
                const fullPath = path.join(inputDir, dirFile)
                fs.statSync(fullPath).isDirectory() ? hits.push(`${prevInput} ${path.join(inputDir,dirFile)}/`)
                : hits.push(`${prevInput} ${path.join(inputDir,dirFile)} `)
              }
            }
          }


        }// for any directory get files. 
        else if(line.includes(' ') && !line.includes('/')){
          const currFiles = fs.readdirSync(process.cwd())
          const input = line.split(' ').at(-1)
          // to get into directory + to get to file within directory
          if(normLine.length===1){
            const firstPath = path.join(process.cwd(), currFiles[0])
            fs.statSync(firstPath).isDirectory() ? hits.push(`${normLine[0]} ${currFiles[0]}/`)
            : hits.push(`${normLine[0]} ${currFiles[0]} `)
          }
          else{
            for(const fname of currFiles){
              const fullPath = path.join(process.cwd(), fname)
              if(fname.startsWith(input)){
                fs.statSync(fullPath).isDirectory() ? hits.push(`${normLine.slice(0,-1).join(' ')}/`)
                : hits.push(`${normLine.slice(0,-1).join(' ')} ${fname} `)
              }
            }   
          } 
        }// for curr directory get files

        // console.log(hits)
        hits = [... new Set(hits)].sort() // handle duplicates create new set with hits, and then arr it

        let LCP = line
        const firstValue = hits[0]
        for(let i = 1; i<hits.length; i++){ // we are going through each and finding where they match. what the lowest is. 
          const firstWord = hits[i-1]
          const secondWord = hits[i]
          let tempLCP = ''

          if(firstWord[0] === secondWord[0]){
            tempLCP += firstWord[0]
            for(let j = 1; j<firstWord.length; j++){
              if(firstWord[j] === secondWord[j]) {tempLCP += firstWord[j]}
              else break
            }
            if(tempLCP.length >  LCP.length){LCP = tempLCP
            break}  
          }
        }

        if(!hits.length) process.stdout.write('\x07')
        else if(hits.length===1){
          return [hits, line]
        } 
        else if(JSON.stringify(hits) === JSON.stringify(hits.filter(hit=>hit.includes(hits[0].trim())))){ // check if filtering by the first(root) gives you hits
          return [[hits[0].trim()], line]
        }
        else if(LCP && tabCount<1){
          if(LCP.length > line.length){

            return [[LCP], line] 
          }
          else{
            process.stdout.write('\x07')
            tabCount += 1
            lastLine = line
          }
        } 
        else{
          tabCount += 1
          if(tabCount===1){
            process.stdout.write('\x07')
          }
          else if(tabCount>1 && !(lastLine===line)){
            tabCount = 1
            process.stdout.write('\x07')
          }
          else{
            tabCount = 0
            hits = hits.map(hit=>{
              if(hit.includes(' ')){
                const parts =  hit.split(' ')
                return !parts[1] ? parts[0] : parts[1]
              }
            })
            const allHits = hits.join(' ')
            
            process.stdout.write('\n')
            console.log(allHits)
            rl._refreshLine()
            return [[],line]
          }
          lastLine = line
        } 
      return [[], line] // if empty [] then will not recognize it as freshinput, and keep cursor at front
  }
});


const validCommands = ['echo', 'exit', 'type', 'pwd']
rl.prompt();

function checkPath(directories, executable){
  // console.log('making it ' + executable)
    for(const dir of directories){
      try{
        const fullPath = path.join(dir, executable)
        fs.accessSync(fullPath, fs.constants.X_OK)
        return fullPath
      }
      catch(error){
        continue
      }
    }
  return null
}
//______ use state machine to basically traverse through any string and only
//pick up the values needed_________________________________________________
function normalize(command){
  let args = []
  let current = ''
  let singleQuotes = false
  let doubleQuotes = false
  let backslash = false
  
  for (const ch of command){
    if(ch===`'` && !doubleQuotes && !backslash){
      singleQuotes = !singleQuotes
    }
    else if(ch===`"` && !singleQuotes && !backslash){
      doubleQuotes = !doubleQuotes
    }
    else if (ch === '\\' && !singleQuotes && !backslash){
      backslash = true
    }
    else if(ch=== ' ' && !singleQuotes && !doubleQuotes &&!backslash){
      if(current){
        args.push(current)
        current = ''
      }
    }
    else{
      current += ch
      if(backslash) backslash = false
    }
  }
  if(current) args.push(current)
  return args
  // else find first single quote then find next. delete both. keep going
  
}



//_________ if type exists but not exec then continue, if non-existent command then return that________
//_____ this entire loop is called a REPL good to know _________________________
rl.on('line', (command)=>{
  let normCom = normalize(command)
  const directories = process.env.PATH.split(path.delimiter)

  if(normCom.includes('>>') || normCom.includes('1>>') ){
    const index = normCom.includes('>>') ? normCom.indexOf('>>') : normCom.indexOf('1>>')
    const targetPath = path.resolve(normCom[index+1])
    try{  
      const message = execFileSync(normCom[0],normCom.slice(1,index),{encoding:'utf8', stdio: ['pipe', 'pipe', 'pipe']})
      fs.appendFileSync(targetPath, message)
    }
    catch(error){
      fs.appendFileSync(targetPath, error.stdout)
      process.stderr.write(error.stderr)
    }
  }
  
  else if(normCom.includes('2>>')){
    const index = normCom.indexOf('2>>') 
    const targetPath = path.resolve(normCom[index+1])
    try{  
      const message = execFileSync(normCom[0],normCom.slice(1,index),{encoding:'utf8', stdio: ['pipe', 'pipe', 'pipe']})
      fs.appendFileSync(targetPath, '')
      process.stdout.write(message)
    }
    catch(error){
      fs.appendFileSync(targetPath, error.stderr)
    }
  }

  else if(normCom.includes('>') || normCom.includes('1>')){
    const index = normCom.includes('>') ? normCom.indexOf('>') : normCom.indexOf('1>')
    const targetFile = path.resolve(normCom[index+1])
    try{
      const output = execFileSync(normCom[0],normCom.slice(1,index),{encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']})
      fs.writeFileSync(targetFile, output)
    }
    catch(error){
      fs.writeFileSync(targetFile, error.stdout)
      process.stderr.write(error.stderr)
    }
  }
  else if(normCom.includes('2>')){
    const index = normCom.indexOf('2>')
    const targetFile = path.resolve(normCom[index+1])
    // core idea here is you want to direct err to file, if no err, then still create file but empty
    // this means you have to handle writing when err doesn't happen, and this can be accomplished through just opening
    // the file pre-emptively, and writing a default if everything goes well
    try{
      const message = execFileSync(normCom[0],normCom.slice(1, index),{encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']})
      fs.writeFileSync(targetFile, '')
      process.stdout.write(message)
    } 
    catch(error){
      fs.writeFileSync(targetFile, error.stderr) 
      process.stdout.write(error.stdout)
    }
  } //  handling 2>


  else if(command === 'exit'){
    rl.close()
    return
  }
  else if(command.startsWith("echo")){
    console.log(`${normCom.slice(1).join(' ')}`)
  }
  else if(command === 'pwd'){
    console.log(process.cwd()) // current working direcotry
  }
  else if (command.startsWith('cat')){
    // console.log('this is inside cat command  ' + normCom)
    const message = execFileSync(normCom[0], normCom.slice(1),{encoding: 'utf8'})
    process.stdout.write(message)
  } // handle cat commands
  
  else if (command.startsWith('cd')){
    const fileName = command.slice(3)
    if(fileName==='~'){
      process.chdir(os.homedir())
    } 
    else{
      const targetFile = path.resolve(fileName)
      if(fs.existsSync(fileName)){
        process.chdir(fileName)
      }
      else{
        console.log(`cd: ${fileName}: No such file or directory`)
      }
    }
  }// handle cd commands

  else if(command.startsWith('type')){
    const secondHalf = command.slice(5)
    const newPath = checkPath(directories, secondHalf)

    if(validCommands.includes(secondHalf)) {
      console.log(`${secondHalf} is a shell builtin`)
    }
    else if(newPath){
      console.log(`${secondHalf} is ${newPath}`)
    }
    else{
      console.log(`${secondHalf}: not found`)
    }
  }// handle type commands

  else if(checkPath(directories, normCom[0])){
    const message = execFileSync(normCom[0], normCom.slice(1), {encoding: 'utf8'})
    process.stdout.write(message) // if we don't want new lines use this. 
  }// check path command 


  else{
    console.log(`${command}: not found`)
  }
  rl.prompt()
})
