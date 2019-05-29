// Inspired by https://github.com/camwest/react-slot-fill

import React from 'react';
import PropTypes from 'prop-types';
import TabButton from 'react-styleguidist/lib/rsg-components/TabButton';
import { formatDefaultTheme } from '../styles/theme';

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
        name: id,
        // Set active prop to active fill
        active: active && id === active,
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
  name: PropTypes.string.isRequired,
  active: PropTypes.string,
  onlyActive: PropTypes.bool,
  props: PropTypes.object,
  className: PropTypes.string,
};
Slot.contextTypes = {
  slots: PropTypes.object.isRequired,
};
