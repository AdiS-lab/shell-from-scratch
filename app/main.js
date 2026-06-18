const readline = require("readline");
const path = require('path');
const fs = require('fs');
const {execFileSync} = require('child_process')
const os = require('os')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});


// console.log('rl is this: ' + rl)

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
  if(command.includes(`''`)){
  }

  const commandDivision = command?.split(' ')
  const directories = process.env.PATH.split(path.delimiter)

  if(command === 'exit'){
    rl.close()
    return
  }
  else if(command.startsWith("echo")){
    console.log(`${normCom.splice(1).join(' ')}`)
  }
  else if(command === 'pwd'){
    console.log(process.cwd()) // current working direcotry
  }
  else if (command.startsWith('cat')){
    // console.log('this is inside cat command  ' + normCom)
    const message = execFileSync(normCom[0], normCom.splice(1),{encoding: 'utf8'})
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
  else if(normCom.includes('>')){
    const index = normCom.indexOf('>')
    const targetFile = path.resolve(normCom[index+1])
    const output = execFileSync(normCom[0], normCom.slice(1,index),{encoding: 'utf8'})
    fs.writeFileSync(targetFile, output)
  }
  else if(checkPath(directories, normCom[0])){
    const message = execFileSync(normCom[0], normCom.slice(1), {encoding: 'utf8'})
    process.stdout.write(message) // if we don't want new lines use this. 
  }// check path command 
  else{
    console.log(`${command}: not found`)
  }
  rl.prompt()
})
