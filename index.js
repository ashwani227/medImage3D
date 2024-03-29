/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import 'vtk.js/Sources/favicon';

import macro from 'vtk.js/Sources/macro';
import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolumeController from 'vtk.js/Sources/Interaction/UI/VolumeController';
import vtkURLExtract from 'vtk.js/Sources/Common/Core/URLExtract';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkFPSMonitor from 'vtk.js/Sources/Interaction/UI/FPSMonitor';

import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkXMLImageDataReader from 'vtk.js/Sources/IO/XML/XMLImageDataReader';
import controlPanel from './controlPanel.html';

import style from './VolumeViewer.module.css';

let autoInit = true;
const userParams = vtkURLExtract.extractURLParameters();
const fpsMonitor = vtkFPSMonitor.newInstance();


//Removing the file from Container of html page
function emptyContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}


function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

//Creating viewer by inputting the file
function createViewer(rootContainer, fileContents, options) {
  //Setting background as Black
  const background = options.background
    ? options.background.split(',').map((s) => Number(s))
    : [0, 0, 0];
  const containerStyle = options.containerStyle;
  //Creating instance of vtkFullScreenRenderWindow
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background,
    rootContainer,
    containerStyle,
  });
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();
  //Update rate of 15ms.
  renderWindow.getInteractor().setDesiredUpdateRate(15);
  fullScreenRenderer.addController(controlPanel);

  const vtiReader = vtkXMLImageDataReader.newInstance();
  //Reading file as array Buffer
  vtiReader.parseAsArrayBuffer(fileContents);

  const source = vtiReader.getOutputData(0);
  const mapper = vtkVolumeMapper.newInstance();
  const actor = vtkVolume.newInstance();

  const dataArray =
    source.getPointData().getScalars() || source.getPointData().getArrays()[0];
	
  const dataRange = dataArray.getRange();

  const lookupTable = vtkColorTransferFunction.newInstance();
  const piecewiseFunction = vtkPiecewiseFunction.newInstance();

  // Pipeline handling
  actor.setMapper(mapper);
  mapper.setInputData(source);
  renderer.addActor(actor);

  //Initializing slice actors for all 3 axis
	const imageActorI = vtkImageSlice.newInstance();
	const imageActorJ = vtkImageSlice.newInstance();
	const imageActorK = vtkImageSlice.newInstance();
	renderer.addActor(imageActorK);
	renderer.addActor(imageActorJ);
	renderer.addActor(imageActorI);
	
//Function to update color levels for slicers
function updateColorLevel(e) {
  const colorLevel = Number(
    (e ? e.target : document.querySelector('.colorLevel')).value
  );
  imageActorI.getProperty().setColorLevel(colorLevel);
  imageActorJ.getProperty().setColorLevel(colorLevel);
  imageActorK.getProperty().setColorLevel(colorLevel);
  renderWindow.render();
}

//Setting color window
function updateColorWindow(e) {
  const colorLevel = Number(
    (e ? e.target : document.querySelector('.colorWindow')).value
  );
  imageActorI.getProperty().setColorWindow(colorLevel);
  imageActorJ.getProperty().setColorWindow(colorLevel);
  imageActorK.getProperty().setColorWindow(colorLevel);
  renderWindow.render();
}


//Reading file
const Reader = vtkXMLImageDataReader.newInstance({
  fetchGzip: true,
});
	if(Reader.parseAsArrayBuffer(fileContents)){   
  const data = Reader.getOutputData();
    const dataRange2 = data
      .getPointData()
      .getScalars()
      .getRange();
    const extent = data.getExtent();
	


    //Initialising mappers
    const imageMapperK = vtkImageMapper.newInstance();
    imageMapperK.setInputData(data);
    imageMapperK.setKSlice(30);
    imageActorK.setMapper(imageMapperK);

    const imageMapperJ = vtkImageMapper.newInstance();
    imageMapperJ.setInputData(data);
    imageMapperJ.setJSlice(30);
    imageActorJ.setMapper(imageMapperJ);

    const imageMapperI = vtkImageMapper.newInstance();
    imageMapperI.setInputData(data);
    imageMapperI.setISlice(30);
    imageActorI.setMapper(imageMapperI);
	


    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();

    //Setting range for slicers from minimum value to maximum
    ['.sliceI', '.sliceJ', '.sliceK'].forEach((selector, idx) => {
      const el = document.querySelector(selector);
      el.setAttribute('min', extent[idx * 2 + 0]);
      el.setAttribute('max', extent[idx * 2 + 1]);
      el.setAttribute('value', 30);
    });
    //Setting range for color level
    ['.colorLevel', '.colorWindow'].forEach((selector) => {
      document.querySelector(selector).setAttribute('max', dataRange2[1]);
      document.querySelector(selector).setAttribute('value', dataRange2[1]);
    });
    document
      .querySelector('.colorLevel')
      .setAttribute('value', (dataRange2[0] + dataRange2[1]) / 2);
	  
    updateColorLevel();
    updateColorWindow();
};
//Adding event listener to Slice I
document.querySelector('.sliceI').addEventListener('input', (e) => {
  imageActorI.getMapper().setISlice(Number(e.target.value));
  renderWindow.render();
});
//Adding event listener to Slice J
document.querySelector('.sliceJ').addEventListener('input', (e) => {
  imageActorJ.getMapper().setJSlice(Number(e.target.value));
  renderWindow.render();
});
//Adding event listener to Slice K
document.querySelector('.sliceK').addEventListener('input', (e) => {
  imageActorK.getMapper().setKSlice(Number(e.target.value));
  renderWindow.render();
});
//Adding event listener to colorLevel input field and color window field
document
  .querySelector('.colorLevel')
  .addEventListener('input', updateColorLevel);
document
  .querySelector('.colorWindow')
  .addEventListener('input', updateColorWindow);

global.fullScreen = fullScreenRenderer;
global.imageActorI = imageActorI;
global.imageActorJ = imageActorJ;
global.imageActorK = imageActorK;
  //Setting properties to the renderer
  const sampleDistance =
    0.7 *
    Math.sqrt(
      source
        .getSpacing()
        .map((v) => v * v)
        .reduce((a, b) => a + b, 0)
    );
  mapper.setSampleDistance(sampleDistance);
  actor.getProperty().setRGBTransferFunction(0, lookupTable);
  actor.getProperty().setScalarOpacity(0, piecewiseFunction);
  // actor.getProperty().setInterpolationTypeToFastLinear();
  actor.getProperty().setInterpolationTypeToLinear();
  //Setting opacity
  actor
    .getProperty()
    .setScalarOpacityUnitDistance(
      0,
      vtkBoundingBox.getDiagonalLength(source.getBounds()) /
        Math.max(...source.getDimensions())
    );
  //Setting gradient value for opacity
  actor.getProperty().setGradientOpacityMinimumValue(0, 0);
  actor
    .getProperty()
    .setGradientOpacityMaximumValue(0, (dataRange[1] - dataRange[0]) * 0.05);
  // Use shading based on gradient
  actor.getProperty().setShade(true);
  actor.getProperty().setUseGradientOpacity(0, true);
  // property values
  actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
  actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
  actor.getProperty().setAmbient(0.2);
  actor.getProperty().setDiffuse(0.7);
  actor.getProperty().setSpecular(0.3);
  actor.getProperty().setSpecularPower(8.0);

  // Control widget
  const controllerWidget = vtkVolumeController.newInstance({
    size: [400, 150],
    rescaleColorMap: true,
  });
  const isBackgroundDark = background[0] + background[1] + background[2] < 1.5;
  controllerWidget.setContainer(rootContainer);
  controllerWidget.setupContent(renderWindow, actor, isBackgroundDark);

  //Resize on changing size of browserwindow
  fullScreenRenderer.setResizeCallback(({ width, height }) => {
    if (width > 414) {
      controllerWidget.setSize(400, 150);
    } else {
      controllerWidget.setSize(width - 14, 150);
    }
    controllerWidget.render();
    fpsMonitor.update();
  });

  // First renderer
  renderer.resetCamera();
  renderWindow.render();

  global.pipeline = {
    actor,
    renderer,
    renderWindow,
    lookupTable,
    mapper,
    source,
    piecewiseFunction,
    fullScreenRenderer,
  };

  if (userParams.fps) {
    const fpsElm = fpsMonitor.getFpsMonitorContainer();
    fpsElm.classList.add(style.fpsMonitor);
    fpsMonitor.setRenderWindow(renderWindow);
    fpsMonitor.setContainer(rootContainer);
    fpsMonitor.update();
  }
}

//Loading vti files from Local machine
export function load(container, options) {
  autoInit = false;
  emptyContainer(container);

  if (options.file) {
    if (options.ext === 'vti') {
      const reader = new FileReader();
      reader.onload = function onLoad(e) {
        createViewer(container, reader.result, options);
      };
      reader.readAsArrayBuffer(options.file);
    } else {
      console.error('Unknown file...');
    }

  }
  //Loading file from http or URL 
  else if (options.fileURL) {
    const progressContainer = document.createElement('div');
    progressContainer.setAttribute('class', style.progress);
    container.appendChild(progressContainer);

    const progressCallback = (progressEvent) => {
      if (progressEvent.lengthComputable) {
        const percent = Math.floor(
          (100 * progressEvent.loaded) / progressEvent.total
        );
        progressContainer.innerHTML = `Loading ${percent}%`;
      } else {
        progressContainer.innerHTML = macro.formatBytesToProperUnit(
          progressEvent.loaded
        );
      }
    };

    HttpDataAccessHelper.fetchBinary(options.fileURL, {
      progressCallback,
    }).then((binary) => {
      container.removeChild(progressContainer);
      createViewer(container, binary, options);
    });
  }
}
//Loading the reader file into html container
export function initLocalFileLoader(container) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = container || exampleContainer || rootBody;

  const fileContainer = document.createElement('div');
  fileContainer.innerHTML = `<div class="${
    style.bigFileDrop
  }"/><input type="file" accept=".vti" style="display: none;"/>`;
  myContainer.appendChild(fileContainer);

  const fileInput = fileContainer.querySelector('input');
  //Handling the loaded file
  function handleFile(e) {
    preventDefaults(e);
    const dataTransfer = e.dataTransfer;
    const files = e.target.files || dataTransfer.files;
    if (files.length === 1) {
      myContainer.removeChild(fileContainer);
      const ext = files[0].name.split('.').slice(-1)[0];
      const options = Object.assign({ file: files[0], ext }, userParams);
      load(myContainer, options);
    }
  }
  //Adding basic event listeners
  fileInput.addEventListener('change', handleFile);
  fileContainer.addEventListener('drop', handleFile);
  fileContainer.addEventListener('click', (e) => fileInput.click());
  fileContainer.addEventListener('dragover', preventDefaults);
}


if (userParams.fileURL) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = exampleContainer || rootBody;
  load(myContainer, userParams);
}
//Loading Viewer container
const viewerContainers = document.querySelectorAll('.vtkjs-volume-viewer');
let nbViewers = viewerContainers.length;
while (nbViewers--) {
  const viewerContainer = viewerContainers[nbViewers];
  const fileURL = viewerContainer.dataset.url;
  const options = Object.assign(
    { containerStyle: { height: '100%' } },
    userParams,
    { fileURL }
  );
  load(viewerContainer, options);
}

// Auto setup if no method get called within 100ms
setTimeout(() => {
  if (autoInit) {
    initLocalFileLoader();
  }
}, 100);
