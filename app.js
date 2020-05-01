const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const prepareOutputFilename = (fileName) => {
  const partNameArr = fileName.split('.');
  return `${partNameArr[0]}-with-watermark.${partNameArr[1]}`;
};

const more = (image, optionType, value) => {
  switch (optionType) {
    case 'make image brighter':
      return image.brightness(value);
      break;
    case 'make image contrast':
      return image.contrast(value);
      break;
    case 'make image b&w':
      return image.greyscale();
      break;
    case 'invert image':
      return image.invert();
      break;
  }
}

const addTextWatermarkToImage = async function(inputFile, outputFile, text, optionType = 'no', value) {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    const textData = {
      text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };

    if (optionType != 'no') {
      more(image, optionType, value)
    }

    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
    console.log('SUCCESS!!!');
    startApp()
  }
  catch (error) {
    startApp();
    console.log('Something went wrong... Try again!')
  }
};

const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile, optionType = 'no', value) {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    if (optionType != 'no') {
      more(image, optionType, value)
    }

    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
    console.log('SUCCESS!!!');
    startApp()
  }
  catch (error) {
    startApp();
    console.log('Something went wrong... Try again! ');
  }
};

const startApp = async () => {

  // Ask if user is ready
  const answer = await inquirer.prompt([{
    name: 'start',
    message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
    type: 'confirm'
  }]);

  // if answer is no, just quit the app
  if (!answer.start) process.exit();

  // ask about input file
  const baseFile = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
  }]);

  // checking if the main file exists
  if (fs.existsSync(!`./img/${baseFile.inputImage}`)) {
    console.log('File do not exist. Please try again.');
        return startApp();
  }
  
  // ask about watermark type
  const options = await inquirer.prompt([{
    name: 'watermarkType',
    type: 'list',
    choices: ['Text watermark', 'Image watermark'],
  }]);
    
  //ask about watermark text
  if (options.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:',
    }]);
    options.watermarkText = text.value;
  }

  // ask about watermark logo
  else {
    const image = await inquirer.prompt([{
      name: 'filename',
      type: 'input',
      message: 'Type your watermark name:',
      default: 'logo.jpg',
    }]);
    options.watermarkImage = image.filename;
    
    //checking if the log file exists
    if (!fs.existsSync(`./img/${image.filename}`)) { 
      console.log('File do not exist. Please try again.');
      return startApp();
    }
  }

  // ask about additional options
  const proceed = await inquirer.prompt([{
    name: 'moreOptions',
    message: 'Do you wont more options?',
    type: 'confirm',
  }])
    
  //if no
  if (!proceed.moreOptions) {
    if (options.watermarkType === 'Text watermark') {
      addTextWatermarkToImage('./img/' + baseFile.inputImage, './img/' + prepareOutputFilename(baseFile.inputImage), options.watermarkText);
    }
    else {
      addImageWatermarkToImage('./img/' + baseFile.inputImage, './img/' + prepareOutputFilename(baseFile.inputImage), './img/' + options.watermarkImage);
    };
  }
  // if yes
  else {
    //ask about type of option
    const additionalOptions = await inquirer.prompt([{
      name: 'additional',
      type: 'list',
      choices: ['make image brighter', 'make image contrast', 'make image b&w', 'invert image'],
    }]);

    //variable suit for brightness and contrast
    let value = 0;

    //setup brighter value
    if (additionalOptions.additional === 'make image brighter') {
      const setupValue = await inquirer.prompt([{
        name: 'value',
        type: 'input',
        message: 'Please setup brightness (scale from -1 to 1. example: 0.5)'
      }]);
      value = parseFloat(setupValue.value);
    }

    //setup contrast value
    if (additionalOptions.additional === 'make image contrast') {
      const setupValue = await inquirer.prompt([{
        name: 'value',
        type: 'input',
        message: 'Please setup contrast (scale from -1 to 1. example: 0.5)'
      }]);
      value = parseFloat(setupValue.value);
    }
    
    //printing images with additional options
    if (options.watermarkType === 'Text watermark') {
      addTextWatermarkToImage('./img/' + baseFile.inputImage, './img/' + prepareOutputFilename(baseFile.inputImage), options.watermarkText, additionalOptions.additional, value);
    }
    else {
        ddImageWatermarkToImage('./img/' + baseFile.inputImage, './img/' + prepareOutputFilename(baseFile.inputImage), './img/' + options.watermarkImage, additionalOptions.additional, value);
    };
  }
}

startApp();