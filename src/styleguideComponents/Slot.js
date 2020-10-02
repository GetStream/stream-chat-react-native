// Inspired by https://github.com/camwest/react-slot-fill

import React from 'react';
import PropTypes from 'prop-types';

export default function Slot(
  { name, active, onlyActive, className, props = {} },
  { slots },
) {
  const fills = slots[name];
  if (!fills) {
    throw new Error(
      `Slot "${name}" not found, available slots: ${Object.keys(slots).join(
        ', ',
      )}`,
    );
  }

  const rendered = fills
    .map((Fill, index) => {
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

        return <render key={index} {...fillProps} />;
      }

      return <Fill key={index} {...fillProps} />;
    })
    .filter(Boolean);

  if (rendered.length === 0) {
    return null;
  }

  return <div className={className}>{rendered}</div>;
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
