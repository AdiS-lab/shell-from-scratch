const readline = require("readline");
const path = require('path');
const fs = require('fs');
const {execFileSync} = require('child_process')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});


// console.log('rl is this: ' + rl)

const validCommands = ['echo', 'exit', 'type']
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

//_________ if type exists but not exec then continue, if non-existent command then return that________
//_____ this entire loop is called a REPL good to know _________________________
rl.on('line', (command)=>{
  // console.log(typeof command)
  const commandDivision = command?.split(' ')
  const directories = process.env.PATH.split(path.delimiter)

  if(command === 'exit'){
    rl.close()
    return
  }
  else if(commandDivision[0]==="echo"){
    console.log(`${command.slice(5)}`)
  }

  else if(commandDivision[0]==='type'){
    const secondHalf = command.slice(5)
    // console.log(directories)
    console.log(secondHalf)
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
  }

  else if(checkPath(directories, commandDivision[0])){
    console.log('made it into checkPath')
    const message = execFileSync(commandDivision[0], commandDivision.slice(1), {encoding: 'utf8'})
    console.log(message)
  }

  else{
    console.log(`${command}: not found`)
  }
  rl.prompt()
})
