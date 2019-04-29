import * as React from 'react';
import { Image } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faFileArchive,
  faFileCode,
  faFileAudio,
  faFileVideo,
  faFileImage,
  faFilePdf,
  faFileAlt,
  faFile,
} from '@fortawesome/free-solid-svg-icons';

import iconPDF from '../images/PDF.png'
import iconDOC from '../images/DOC.png'
import iconPPT from '../images/PPT.png'
import iconXLS from '../images/XLS.png'
import iconTAR from '../images/TAR.png'

// export type Props = {|
//   filename: ?string,
//   mimeType: ?string,
//   big: boolean,
//   // Size used for big icon
//   size: number,
// |};

// Partially based on:
// https://stackoverflow.com/a/4212908/2570866

const wordMimeTypes = [
  // Microsoft Word
  // .doc .dot
  'application/msword',
  // .doc .dot
  'application/msword-template',
  // .docx
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // .dotx (no test)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  // .docm
  'application/vnd.ms-word.document.macroEnabled.12',
  // .dotm (no test)
  'application/vnd.ms-word.template.macroEnabled.12',

  // LibreOffice/OpenOffice Writer
  // .odt
  'application/vnd.oasis.opendocument.text',
  // .ott
  'application/vnd.oasis.opendocument.text-template',
  // .fodt
  'application/vnd.oasis.opendocument.text-flat-xml',
  // .uot
  // NOTE: firefox doesn't know mimetype so maybe ignore
];

const excelMimeTypes = [
  // .csv
  'text/csv',
  // TODO: maybe more data files

  // Microsoft Excel
  // .xls .xlt .xla (no test for .xla)
  'application/vnd.ms-excel',
  // .xlsx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // .xltx (no test)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  // .xlsm
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  // .xltm (no test)
  'application/vnd.ms-excel.template.macroEnabled.12',
  // .xlam (no test)
  'application/vnd.ms-excel.addin.macroEnabled.12',
  // .xlsb (no test)
  'application/vnd.ms-excel.addin.macroEnabled.12',

  // LibreOffice/OpenOffice Calc
  // .ods
  'application/vnd.oasis.opendocument.spreadsheet',
  // .ots
  'application/vnd.oasis.opendocument.spreadsheet-template',
  // .fods
  'application/vnd.oasis.opendocument.spreadsheet-flat-xml',
  // .uos
  // NOTE: firefox doesn't know mimetype so maybe ignore
];

const powerpointMimeTypes = [
  // Microsoft Word
  // .ppt .pot .pps .ppa (no test for .ppa)
  'application/vnd.ms-powerpoint',
  // .pptx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // .potx (no test)
  'application/vnd.openxmlformats-officedocument.presentationml.template',
  // .ppsx
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  // .ppam
  'application/vnd.ms-powerpoint.addin.macroEnabled.12',
  // .pptm
  'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  // .potm
  'application/vnd.ms-powerpoint.template.macroEnabled.12',
  // .ppsm
  'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',

  // LibreOffice/OpenOffice Writer
  // .odp
  'application/vnd.oasis.opendocument.presentation',
  // .otp
  'application/vnd.oasis.opendocument.presentation-template',
  // .fodp
  'application/vnd.oasis.opendocument.presentation-flat-xml',
  // .uop
  // NOTE: firefox doesn't know mimetype so maybe ignore
];

const archiveFileTypes = [
  // .zip
  'application/zip',
  // .z7
  'application/x-7z-compressed',
  // .ar
  'application/x-archive',
  // .tar
  'application/x-tar',
  // .tar.gz
  'application/gzip',
  // .tar.Z
  'application/x-compress',
  // .tar.bz2
  'application/x-bzip',
  // .tar.lz
  'application/x-lzip',
  // .tar.lz4
  'application/x-lz4',
  // .tar.lzma
  'application/x-lzma',
  // .tar.lzo (no test)
  'application/x-lzop',
  // .tar.xz
  'application/x-xz',
  // .war
  'application/x-webarchive',
  // .rar
  'application/vnd.rar',
];

const codeFileTypes = [
  // .html .htm
  'text/html',
  // .css
  'text/css',
  // .js
  'application/x-javascript',
  // .json
  'application/json',
  // .py
  'text/x-python',
  // .go
  'text/x-go',
  // .c
  'text/x-csrc',
  // .cpp
  'text/x-c++src',
  // .rb
  'application/x-ruby',
  // .rust
  'text/rust',
  // .java
  'text/x-java',
  // .php
  'application/x-php',
  // .cs
  'text/x-csharp',
  // .scala
  'text/x-scala',
  // .erl
  'text/x-erlang',
  // .sh
  'application/x-shellscript',
];

const defaultStyles = {
  '3dm': {
    labelColor: '#8D1A11',
    type: '3d',
  },
  '3ds': {
    labelColor: '#5FB9AD',
    type: '3d',
  },
  '3g2': {
    type: 'video',
  },
  '3gp': {
    type: 'video',
  },
  '7zip': {
    type: 'compressed',
  },
  aac: {
    type: 'audio',
  },
  aep: {
    type: 'video',
  },
  ai: {
    color: '#423325',
    gradientOpacity: 0,
    labelColor: '#423325',
    labelTextColor: '#FF7F18',
    labelUppercase: true,
    foldColor: '#FF7F18',
    radius: 2,
  },
  aif: {
    type: 'audio',
  },
  aiff: {
    type: 'audio',
  },
  asf: {
    type: 'video',
  },
  asp: {
    type: 'code',
  },
  aspx: {
    type: 'code',
  },
  avi: {
    type: 'video',
  },
  bin: {
    type: 'binary',
  },
  bmp: {
    type: 'image',
  },
  c: {
    type: 'code',
  },
  cpp: {
    type: 'code',
  },
  cs: {
    type: 'code',
  },
  css: {
    type: 'code',
  },
  csv: {
    type: 'spreadsheet',
  },
  cue: {
    type: 'document',
  },
  dll: {
    type: 'settings',
  },
  dmg: {
    type: 'drive',
  },
  doc: {
    color: '#2C5898',
    foldColor: '#254A80',
    glyphColor: 'rgba(255,255,255,0.4)',
    labelColor: '#2C5898',
    labelUppercase: true,
    type: 'document',
  },
  docx: {
    color: '#2C5898',
    foldColor: '#254A80',
    glyphColor: 'rgba(255,255,255,0.4)',
    labelColor: '#2C5898',
    labelUppercase: true,
    type: 'document',
  },
  dwg: {
    type: 'vector',
  },
  dxf: {
    type: 'vector',
  },
  eot: {
    type: 'font',
  },
  eps: {
    type: 'vector',
  },
  exe: {
    type: 'settings',
  },
  flac: {
    type: 'audio',
  },
  flv: {
    type: 'video',
  },
  fnt: {
    type: 'font',
  },
  fodp: {
    type: 'presentation',
  },
  fods: {
    type: 'spreadsheet',
  },
  fodt: {
    type: 'document',
  },
  fon: {
    type: 'font',
  },
  gif: {
    type: 'image',
  },
  gz: {
    type: 'compressed',
  },
  htm: {
    type: 'code',
  },
  html: {
    type: 'code',
  },
  indd: {
    color: '#4B2B36',
    gradientOpacity: 0,
    labelColor: '#4B2B36',
    labelTextColor: '#FF408C',
    labelUppercase: true,
    foldColor: '#FF408C',
    radius: 2,
  },
  ini: {
    type: 'settings',
  },
  java: {
    type: 'code',
  },
  jpeg: {
    type: 'image',
  },
  jpg: {
    type: 'image',
  },
  js: {
    labelColor: '#F7DF1E',
    type: 'code',
  },
  json: {
    type: 'code',
  },
  jsx: {
    labelColor: '#00D8FF',
    type: 'code',
  },
  m4a: {
    type: 'audio',
  },
  m4v: {
    type: 'video',
  },
  max: {
    labelColor: '#5FB9AD',
    type: '3d',
  },
  md: {
    type: 'document',
  },
  mid: {
    type: 'audio',
  },
  mkv: {
    type: 'video',
  },
  mov: {
    type: 'video',
  },
  mp3: {
    type: 'audio',
  },
  mp4: {
    type: 'video',
  },
  mpeg: {
    type: 'video',
  },
  mpg: {
    type: 'video',
  },
  obj: {
    type: '3d',
  },
  odp: {
    type: 'presentation',
  },
  ods: {
    type: 'spreadsheet',
  },
  odt: {
    type: 'document',
  },
  ogg: {
    type: 'audio',
  },
  ogv: {
    type: 'video',
  },
  otf: {
    type: 'font',
  },
  pdf: {
    labelColor: '#D93831',
    type: 'acrobat',
  },
  php: {
    labelColor: '#8892BE',
    type: 'code',
  },
  pkg: {
    type: '3d',
  },
  plist: {
    type: 'settings',
  },
  png: {
    type: 'image',
  },
  ppt: {
    color: '#D14423',
    foldColor: '#AB381D',
    glyphColor: 'rgba(255,255,255,0.4)',
    labelColor: '#D14423',
    labelUppercase: true,
    type: 'presentation',
  },
  pptx: {
    color: '#D14423',
    foldColor: '#AB381D',
    glyphColor: 'rgba(255,255,255,0.4)',
    labelColor: '#D14423',
    labelUppercase: true,
    type: 'presentation',
  },
  pr: {
    type: 'video',
  },
  ps: {
    type: 'vector',
  },
  psd: {
    color: '#34364E',
    gradientOpacity: 0,
    labelColor: '#34364E',
    labelTextColor: '#31C5F0',
    labelUppercase: true,
    foldColor: '#31C5F0',
    radius: 2,
  },
  py: {
    labelColor: '#FFDE57',
    type: 'code',
  },
  rar: {
    type: 'compressed',
  },
  rb: {
    labelColor: '#BB271A',
    type: 'code',
  },
  rm: {
    type: 'video',
  },
  rtf: {
    type: 'document',
  },
  scss: {
    labelColor: '#C16A98',
    type: 'code',
  },
  sitx: {
    type: 'compressed',
  },
  svg: {
    type: 'vector',
  },
  swf: {
    type: 'video',
  },
  sys: {
    type: 'settings',
  },
  tar: {
    type: 'compressed',
  },
  tex: {
    type: 'document',
  },
  tif: {
    type: 'image',
  },
  tiff: {
    type: 'image',
  },
  ts: {
    labelColor: '#3478C7',
    type: 'code',
  },
  ttf: {
    type: 'font',
  },
  txt: {
    type: 'document',
  },
  wav: {
    type: 'audio',
  },
  webm: {
    type: 'video',
  },
  wmv: {
    type: 'video',
  },
  woff: {
    type: 'font',
  },
  wpd: {
    type: 'document',
  },
  wps: {
    type: 'document',
  },
  xlr: {
    type: 'spreadsheet',
  },
  xls: {
    color: '#1A754C',
    foldColor: '#16613F',
    glyphColor: 'rgba(255,255,255,0.4)',
    labelColor: '#1A754C',
    labelUppercase: true,
    type: 'spreadsheet',
  },
  xlsx: {
    color: '#1A754C',
    foldColor: '#16613F',
    glyphColor: 'rgba(255,255,255,0.4)',
    labelColor: '#1A754C',
    labelUppercase: true,
    type: 'spreadsheet',
  },
  yml: {
    type: 'code',
  },
  zip: {
    type: 'compressed',
  },
  zipx: {
    type: 'compressed',
  },
};
const mimeTypeToIconMap = {
  'application/pdf': iconPDF,
};

for (const type of wordMimeTypes) {
  mimeTypeToIconMap[type] = iconDOC;
}

for (const type of excelMimeTypes) {
  mimeTypeToIconMap[type] = iconXLS;
}

for (const type of powerpointMimeTypes) {
  mimeTypeToIconMap[type] = iconPPT;
}

for (const type of archiveFileTypes) {
  mimeTypeToIconMap[type] = iconTAR;
}

for (const type of codeFileTypes) {
  mimeTypeToIconMap[type] = iconDOC;
}

function mimeTypeToIcon(mimeType) {
  if (mimeType == null) {
    return faFile;
  }

  const icon = mimeTypeToIconMap[mimeType];
  if (icon) {
    return icon;
  }

  return iconDOC;
}

function mimeTypeToStyle(mimeType) {
  if (mimeType == null) {
    return {};
  }

  const style = mimeTypeToStyle[mimeType];
  if (style) {
    return style;
  }
  if (mimeType.startsWith('audio/')) {
    return { type: 'audio' };
  }
  if (mimeType.startsWith('video/')) {
    return { type: 'video' };
  }
  if (mimeType.startsWith('image/')) {
    return { type: 'image' };
  }
  if (mimeType.startsWith('text/')) {
    return { type: 'document' };
  }

  return {};
}

function fileExtension(filename) {
  const defaultReturn = {
    full: '',
    end: '',
  };
  if (filename == null) {
    return defaultReturn;
  }

  // source: https://stackoverflow.com/a/1203361/2570866
  const a = filename.split('.');
  if (a.length === 1 || (a[0] === '' && a.length === 2)) {
    return defaultReturn;
  }
  const lastExtension = a.pop().toLowerCase();
  if (a.length === 1 || (a[0] === '' && a.length === 2)) {
    return { end: lastExtension, full: lastExtension };
  }
  const secondToLastExtension = a.pop().toLowerCase();
  if (secondToLastExtension !== 'tar') {
    return { end: lastExtension, full: lastExtension };
  }

  return {
    full: secondToLastExtension + '.' + lastExtension,
    end: lastExtension,
  };
}

/**
 * @example ./examples/FileIcon.md
 */
export default class FileIcon extends React.Component {
  render() {
    const { size, big, filename, mimeType } = this.props;
    return <Image source={mimeTypeToIcon(mimeType)} />;
  }
}
