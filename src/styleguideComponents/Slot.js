// Inspired by https://github.com/camwest/react-slot-fill

import React from 'react';
import PropTypes from 'prop-types';
import TabButton from 'react-styleguidist/lib/rsg-components/TabButton';
import { originalCSS } from '../styles/theme';
import { defaultTheme } from '../styles/themeConstants';
import merge from 'lodash/merge';
import lodashGet from 'lodash/get';
import lodashSet from 'lodash/set';
import isPlainObject from 'lodash/isPlainObject';

const StylesButton = (props) => {
  const component = props.module[props.visibleName];
  return component && component.themePath != null ? (
    <TabButton {...props}>Styles</TabButton>
  ) : null;
};

const StylesTab = (props) => {
  const component = props.module[props.visibleName];
  return component && component.themePath != null
    ? formatDefaultTheme(component)
    : null;
};

const formatDefaultTheme = (component) => {
  const path = component.themePath;
  const extraThemePaths = component.extraThemePaths || [];
  let mainTheme = defaultTheme;
  let mainThemeText = '';
  if (path !== '') {
    mainTheme = merge(
      {},
      lodashGet(defaultTheme, path),
      lodashGet(originalCSS, path),
    );
    mainThemeText = `The path for this component in the full theme is "${path}" with the following styles:\n`;
  }

  console.log(originalCSS);
  const extraThemes = {};
  for (let i = 0; i < extraThemePaths.length; i++) {
    lodashSet(
      extraThemes,
      extraThemePaths[i],
      lodashGet(defaultTheme, extraThemePaths[i]),
    );
  }

  const extraThemeText =
    extraThemePaths.length === 0
      ? ''
      : `\n\nSome other items from the full theme that might be useful to set on this component:\n${JSON.stringify(
          extraThemes,
          null,
          2,
        )}`;

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        whiteSpace: 'pre-wrap',
      }}
    >
      {mainThemeText}
      <table>
        <thead />
        <tbody>
          <tr>
            <td>{themeToReact(mainTheme)}</td>
          </tr>
        </tbody>
      </table>
      {`${extraThemeText}`}
    </div>
  );
};

const themeToReact = (v, k, prefix = '') => {
  if (!isPlainObject(v)) {
    return (
      <div key={k}>
        {prefix}
        {k}: <strong>{v}</strong>
      </div>
    );
  }
  const children = [];
  for (const k in v) {
    children.push(themeToReact(v[k], k, prefix + '  '));
  }
  return (
    <div className='str-chat-style-row'>
      {k ? `${prefix}${k}: ` : null}
      {children}
    </div>
  );
};

export default function Slot(
  { name, active, onlyActive, className, props = {} },
  { slots },
) {
  let fills = slots[name];
  if (!fills) {
    throw new Error(
      `Slot "${name}" not found, available slots: ${Object.keys(slots).join(
        ', ',
      )}`,
    );
  }

  if (name === 'docsTabButtons') {
    fills = [...fills, { id: 'rsg-styles', render: StylesButton }];
  }

  if (name === 'docsTabs') {
    fills = [...fills, { id: 'rsg-styles', render: StylesTab }];
  }

  const rendered = fills.map((Fill, index) => {
    // { id: 'pizza', render: ({ foo }) => <div>{foo}</div> }
    const { id, render } = Fill;
    let fillProps = props;
    if (id && render) {
      // Render only specified fill
      if (onlyActive && id !== active) {
        return null;
      }

      const { onClick } = props;
      fillProps = {
        ...props,
        // Set active prop to active fill
        active: active && id === active,
        name: id,
        // Pass fill ID to onClick event handler
        // eslint-disable-next-line react/prop-types
        onClick: onClick && ((...attrs) => onClick(id, ...attrs)),
      };

      Fill = render;
    }

    return <Fill key={index} {...fillProps} />;
  });

  const filtered = rendered.filter(Boolean);
  if (filtered.length === 0) {
    return null;
  }

  return <div className={className}>{filtered}</div>;
}

Slot.propTypes = {
  active: PropTypes.string,
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  onlyActive: PropTypes.bool,
  props: PropTypes.object,
};
Slot.contextTypes = {
  slots: PropTypes.object.isRequired,
};
