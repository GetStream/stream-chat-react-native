import React from 'react';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import { Audio } from '../../icons/Audio';
import { CSV } from '../../icons/CSV';
import { DOC } from '../../icons/DOC';
import { DOCX } from '../../icons/DOCX';
import { GenericFile } from '../../icons/GenericFile';
import { HTML } from '../../icons/HTML';
import { MD } from '../../icons/MD';
import { ODT } from '../../icons/ODT';
import { PDF } from '../../icons/PDF';
import { PPT } from '../../icons/PPT';
import { PPTX } from '../../icons/PPTX';
import { RAR } from '../../icons/RAR';
import { RTF } from '../../icons/RTF';
import { SEVEN_Z } from '../../icons/SEVEN_Z';
import { TAR } from '../../icons/TAR';
import { TXT } from '../../icons/TXT';
import type { IconProps } from '../../icons/utils/base';
import { XLS } from '../../icons/XLS';
import { XLSX } from '../../icons/XLSX';
import { ZIP } from '../../icons/ZIP';

// https://www.iana.org/assignments/media-types/media-types.xhtml#audio
const audioFileTypes = [
  'audio/1d-interleaved-parityfec',
  'audio/32kadpcm',
  'audio/3gpp',
  'audio/3gpp2',
  'audio/aac',
  'audio/ac3',
  'audio/AMR',
  'audio/AMR-WB',
  'audio/amr-wb+',
  'audio/aptx',
  'audio/asc',
  'audio/ATRAC-ADVANCED-LOSSLESS',
  'audio/ATRAC-X',
  'audio/ATRAC3',
  'audio/basic',
  'audio/BV16',
  'audio/BV32',
  'audio/clearmode',
  'audio/CN',
  'audio/DAT12',
  'audio/dls',
  'audio/dsr-es201108',
  'audio/dsr-es202050',
  'audio/dsr-es202211',
  'audio/dsr-es202212',
  'audio/DV',
  'audio/DVI4',
  'audio/eac3',
  'audio/encaprtp',
  'audio/EVRC',
  'audio/EVRC-QCP',
  'audio/EVRC0',
  'audio/EVRC1',
  'audio/EVRCB',
  'audio/EVRCB0',
  'audio/EVRCB1',
  'audio/EVRCNW',
  'audio/EVRCNW0',
  'audio/EVRCNW1',
  'audio/EVRCWB',
  'audio/EVRCWB0',
  'audio/EVRCWB1',
  'audio/EVS',
  'audio/example',
  'audio/flexfec',
  'audio/fwdred',
  'audio/G711-0',
  'audio/G719',
  'audio/G7221',
  'audio/G722',
  'audio/G723',
  'audio/G726-16',
  'audio/G726-24',
  'audio/G726-32',
  'audio/G726-40',
  'audio/G728',
  'audio/G729',
  'audio/G7291',
  'audio/G729D',
  'audio/G729E',
  'audio/GSM',
  'audio/GSM-EFR',
  'audio/GSM-HR-08',
  'audio/iLBC',
  'audio/ip-mr_v2.5',
  'audio/L8',
  'audio/L16',
  'audio/L20',
  'audio/L24',
  'audio/LPC',
  'audio/MELP',
  'audio/MELP600',
  'audio/MELP1200',
  'audio/MELP2400',
  'audio/mhas',
  'audio/mobile-xmf',
  'audio/MPA',
  'audio/mp4',
  'audio/MP4A-LATM',
  'audio/mpa-robust',
  'audio/mpeg',
  'audio/mpeg4-generic',
  'audio/ogg',
  'audio/opus',
  'audio/parityfec',
  'audio/PCMA',
  'audio/PCMA-WB',
  'audio/PCMU',
  'audio/PCMU-WB',
  'audio/prs.sid',
  'audio/raptorfec',
  'audio/RED',
  'audio/rtp-enc-aescm128',
  'audio/rtploopback',
  'audio/rtp-midi',
  'audio/rtx',
  'audio/SMV',
  'audio/SMV0',
  'audio/SMV-QCP',
  'audio/sofa',
  'audio/sp-midi',
  'audio/speex',
  'audio/t140c',
  'audio/t38',
  'audio/telephone-event',
  'audio/TETRA_ACELP',
  'audio/TETRA_ACELP_BB',
  'audio/tone',
  'audio/TSVCIS',
  'audio/UEMCLIP',
  'audio/ulpfec',
  'audio/usac',
  'audio/VDVI',
  'audio/VMR-WB',
  'audio/vnd.3gpp.iufp',
  'audio/vnd.4SB',
  'audio/vnd.audiokoz',
  'audio/vnd.CELP',
  'audio/vnd.cisco.nse',
  'audio/vnd.cmles.radio-events',
  'audio/vnd.cns.anp1',
  'audio/vnd.cns.inf1',
  'audio/vnd.dece.audio',
  'audio/vnd.digital-winds',
  'audio/vnd.dlna.adts',
  'audio/vnd.dolby.heaac.1',
  'audio/vnd.dolby.heaac.2',
  'audio/vnd.dolby.mlp',
  'audio/vnd.dolby.mps',
  'audio/vnd.dolby.pl2',
  'audio/vnd.dolby.pl2x',
  'audio/vnd.dolby.pl2z',
  'audio/vnd.dolby.pulse.1',
  'audio/vnd.dra',
  'audio/vnd.dts',
  'audio/vnd.dts.hd',
  'audio/vnd.dts.uhd',
  'audio/vnd.dvb.file',
  'audio/vnd.everad.plj',
  'audio/vnd.hns.audio',
  'audio/vnd.lucent.voice',
  'audio/vnd.ms-playready.media.pya',
  'audio/vnd.nokia.mobile-xmf',
  'audio/vnd.nortel.vbk',
  'audio/vnd.nuera.ecelp4800',
  'audio/vnd.nuera.ecelp7470',
  'audio/vnd.nuera.ecelp9600',
  'audio/vnd.octel.sbc',
  'audio/vnd.presonus.multitrack',
  'audio/vnd.qcelp',
  'audio/vnd.rhetorex.32kadpcm',
  'audio/vnd.rip',
  'audio/vnd.sealedmedia.softseal.mpeg',
  'audio/vnd.vmx.cvsd',
  'audio/vorbis',
  'audio/vorbis-config',
];

// Partially based on:
// https://stackoverflow.com/a/4212908/2570866

const docMimeTypes = [
  // Microsoft Word
  // .doc .dot
  'application/msword',
  // .doc .dot
  'application/msword-template',

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

const docXMimeTypes = [
  // Microsoft Word
  // .docx
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // .dotx (no test)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  // .docm
  'application/vnd.ms-word.document.macroEnabled.12',
  // .dotm (no test)
  'application/vnd.ms-word.template.macroEnabled.12',
];

const excelMimeTypes = [
  // Microsoft Excel
  // .xls .xlt .xla (no test for .xla)
  'application/vnd.ms-excel',

  // LibreOffice/OpenOffice Calc
  // .ods
  'application/vnd.oasis.opendocument.spreadsheet',
  // .ots
  'application/vnd.oasis.opendocument.spreadsheet-template',
  // .fods
  'application/vnd.oasis.opendocument.spreadsheet-flat-xml',
];

const excelXMimeTypes = [
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
];

const odtMimeTypes = [
  // LibreOffice/OpenOffice Writer
  // .odt
  'application/vnd.oasis.opendocument.text',
  // .ott
  'application/vnd.oasis.opendocument.text-template',
  // .fodt
  'application/vnd.oasis.opendocument.text-flat-xml',
];

const powerpointMimeTypes = [
  // Microsoft Word
  // .ppt .pot .pps .ppa (no test for .ppa)
  'application/vnd.ms-powerpoint',

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

const powerpointXMimeTypes = [
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
];

const tarFileTypes = [
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
];

const zipFileTypes = [
  // .gzip
  'application/gzip',
  // .zip
  'application/zip',
];

const mimeTypeToIconMap: Record<string, React.FC<IconProps>> = {
  'application/pdf': PDF, // .pdf
  'application/rtf': RTF, // .rtf
  'application/vnd.rar': RAR, // .rar
  'application/x-7z-compressed': SEVEN_Z, // .z7
  'text/csv': CSV, // .csv
  'text/html': HTML, // .html .htm
  'text/markdown': MD, // .md
  'text/plain': TXT, // .txt
};

for (const type of audioFileTypes) {
  mimeTypeToIconMap[type] = Audio;
}

for (const type of docMimeTypes) {
  mimeTypeToIconMap[type] = DOC;
}

for (const type of docXMimeTypes) {
  mimeTypeToIconMap[type] = DOCX;
}

for (const type of excelMimeTypes) {
  mimeTypeToIconMap[type] = XLS;
}

for (const type of excelXMimeTypes) {
  mimeTypeToIconMap[type] = XLSX;
}

for (const type of odtMimeTypes) {
  mimeTypeToIconMap[type] = ODT;
}

for (const type of powerpointMimeTypes) {
  mimeTypeToIconMap[type] = PPT;
}

for (const type of powerpointXMimeTypes) {
  mimeTypeToIconMap[type] = PPTX;
}

for (const type of tarFileTypes) {
  mimeTypeToIconMap[type] = TAR;
}

for (const type of zipFileTypes) {
  mimeTypeToIconMap[type] = ZIP;
}

function mimeTypeToIcon(mimeType?: string): React.FC<IconProps> {
  if (!mimeType) return GenericFile;

  const Icon = mimeTypeToIconMap[mimeType];
  if (Icon) return Icon;

  return GenericFile;
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
  } = useTheme('FileIcon');

  const Icon = mimeTypeToIcon(mimeType);

  return <Icon {...(size ? { height: size, width: size } : {})} {...icon} />;
};

FileIcon.displayName = 'FileIcon{messageSimple{file{icon}}}';
