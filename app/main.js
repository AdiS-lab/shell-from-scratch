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

function normalize(command){
  let args = []
  let current = ''
  let singleQuotes = false
  let doubleQuotes = false
  
  for (const ch of command){
    if(ch===`'`){
      singleQuotes = !singleQuotes
    }
    else if(ch===`"`){
      doubleQuotes = !doubleQuotes
    }
    else if(ch=== ' ' && !singleQuotes && !doubleQuotes){
      if(current){
        args.push(current)
        current = ''
      }
    }
    else{
      current += ch
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

  else if(checkPath(directories, commandDivision[0])){
    const message = execFileSync(commandDivision[0], commandDivision.slice(1), {encoding: 'utf8'})
    process.stdout.write(message) // if we don't want new lines use this. 
  }
  else{
    console.log(`${command}: not found`)
  }
  rl.prompt()
})
