const readline = require("readline");
const path = require('path');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});


// console.log('rl is this: ' + rl)

const validCommands = ['echo', 'exit', 'type']
rl.prompt();

function checkPath(directories, secondHalf){
    for(dir in directories){
      try{
        console.log('made it inside the for loop')
        const fullPath = path.join(dir, executable)
        if(fs.accessSync(fullPath, fs.constants.X_OK)){
          return dir
        }
      }
      catch(error){
        continue
      }
    }
  return null
}

//_________ if type exists but not exec then continue, if non-existent command then return that________
rl.on('line', (command)=>{
  // console.log(typeof command)
  if(command === 'exit'){
    rl.close()
    return
  }
  else if(command.startsWith("echo")){
    console.log(`${command.slice(5)}`)
  }
  else if(command?.startsWith('type')){
    const secondHalf = command.slice(5)
    const directories = process.env.PATH.split(path.delimeter)
    const newPath = checkPath(directories, secondHalf)
    console.log(newPath)

    if(validCommands.includes(secondHalf)) {
      console.log(`${secondHalf} is a shell builtin`)
    }
    else if(newPath){
      console.log(`${secondHalf} is ${dir}`)
    }
    else{
      console.log(`${secondHalf} not found`)
    }
  }
  rl.prompt()
})
