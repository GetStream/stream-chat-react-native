import * as React from 'react';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import { CSV } from '../../icons/CSV';
import { DOC } from '../../icons/DOC';
import { PDF } from '../../icons/PDF';
import { PPT } from '../../icons/PPT';
import { TAR } from '../../icons/TAR';
import { XLS } from '../../icons/XLS';
import { ZIP } from '../../icons/ZIP';

import type { IconProps } from '../../icons/utils/base';

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

const tarFileTypes = [
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

const zipFileTypes = [
  // .gzip
  'application/gzip',
  // .zip
  'application/zip',
];

const mimeTypeToIconMap: Record<string, React.FC<IconProps>> = {
  'application/pdf': PDF,
  'text/csv': CSV, // .csv
};

for (const type of wordMimeTypes) {
  mimeTypeToIconMap[type] = DOC;
}

for (const type of excelMimeTypes) {
  mimeTypeToIconMap[type] = XLS;
}

for (const type of powerpointMimeTypes) {
  mimeTypeToIconMap[type] = PPT;
}

for (const type of tarFileTypes) {
  mimeTypeToIconMap[type] = TAR;
}

for (const type of codeFileTypes) {
  mimeTypeToIconMap[type] = DOC;
}

for (const type of zipFileTypes) {
  mimeTypeToIconMap[type] = ZIP;
}

function mimeTypeToIcon(mimeType?: string): React.FC<IconProps> {
  if (!mimeType) return DOC;

  const Icon = mimeTypeToIconMap[mimeType];
  if (Icon) return Icon;

  return DOC;
}

export type FileIconProps = {
  mimeType?: string;
  size?: number;
};

export const FileIcon: React.FC<FileIconProps> = ({ mimeType, size }) => {
  const {
    theme: {
      messageSimple: {
        file: { icon },
      },
    },
  } = useTheme();

  const Icon = mimeTypeToIcon(mimeType);

  return <Icon {...(size ? { height: size, width: size } : {})} {...icon} />;
};

FileIcon.displayName = 'FileIcon{messageSimple{file{icon}}}';
