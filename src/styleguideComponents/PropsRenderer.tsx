import React from 'react';
import Arguments from './ArgumentsRenderer';
import Argument from 'react-styleguidist/lib/client/rsg-components/Argument';
import JsDoc from './JsDoc';
import Markdown from 'react-styleguidist/lib/client/rsg-components/Markdown';
import Name from 'react-styleguidist/lib/client/rsg-components/Name';
import Para from 'react-styleguidist/lib/client/rsg-components/Para';
import renderTypeColumn from 'react-styleguidist/lib/client/rsg-components/Props/renderType';
import renderExtra from 'react-styleguidist/lib/client/rsg-components/Props/renderExtra';
import renderDefault from 'react-styleguidist/lib/client/rsg-components/Props/renderDefault';
import { PropDescriptor } from 'react-styleguidist/lib/client/rsg-components/Props/util';

function renderDescription(prop: PropDescriptor) {
  const { description, tags = {} } = prop;
  const extra = renderExtra(prop);
  const args = [...(tags.arg || []), ...(tags.argument || []), ...(tags.param || [])];
  const returnDocumentation = (tags.return && tags.return[0]) || (tags.returns && tags.returns[0]);

  return (
    <div>
      {description && <Markdown text={description} />}
      {extra && <Para>{extra}</Para>}
      <JsDoc {...tags} />
      {args.length > 0 && <Arguments args={args} heading />}
      {returnDocumentation && <Argument {...{ ...returnDocumentation, name: '' }} returns />}
    </div>
  );
}

function renderName(prop: PropDescriptor) {
  const { name, tags = {} } = prop;
  return <Name deprecated={!!tags.deprecated}>{name}</Name>;
}

export function getRowKey(row: { name: string }) {
  return row.name;
}

export const columns = [
  {
    caption: 'Prop name lol',
    render: renderName,
  },
  {
    caption: 'Type',
    render: renderTypeColumn,
  },
  {
    caption: 'Default',
    render: renderDefault,
  },
  {
    caption: 'Description',
    render: renderDescription,
  },
];

interface PropsProps {
  props: PropDescriptor[];
}

const PropsRenderer: React.FC<PropsProps> = ({ props }) =>
  props.map((r) => {
    const isComponentProp = r.name[0].toUpperCase() === r.name[0];
    const customType = r.tags.overrideType;

    return (
      <div key={r.name} style={styles.container}>
        <h3>
          <a
            href={`#${r.name}`}
            id={r.name}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.06)',
              color: '#1c1e21',
              fontFamily: 'monospace',
              fontSize: 21,
              fontWeight: 700,
              padding: 5,
              paddingLeft: 10,
              paddingRight: 10,
              textDecoration: 'none',
            }}
          >
            {r.name}
          </a>
        </h3>
        {renderDescription(r)}

        <table style={styles.table}>
          <tr style={styles.tr}>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Required</th>
          </tr>
          <tr style={styles.tr}>
            <td style={styles.td}>
              {customType
                ? customType[0].description
                : isComponentProp
                ? 'Component, element'
                : r.type.name}
            </td>
            <td style={styles.td}>No</td>
          </tr>
        </table>
        <hr style={{ marginTop: 20 }} />
      </div>
    );
  });

const styles = {
  container: {
    marginTop: 50,
  },
  table: {
    border: '1px solid black',
    borderCollapse: 'collapse',
    width: '100%',
  },
  td: {
    border: '1px solid black',
    borderCollapse: 'collapse',
    padding: 10,
    textAlign: 'center',
    width: '50%',
  },
  th: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    border: '1px solid black',
    borderCollapse: 'collapse',
    padding: 10,
    textAlign: 'center',
    width: '50%',
  },
  tr: {},
};

export default PropsRenderer;
