import React from 'react';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';
import { Attachment } from './Attachment';

const Container = styled.View`
  display: flex;
  align-items: stretch;
`;

export class FileAttachmentGroup extends React.PureComponent {
  static propTypes = {
    messageId: PropTypes.string,
    files: PropTypes.array,
    handleAction: PropTypes.func,
    alignment: PropTypes.oneOf(['right', 'left']),
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { messageId, files, handleAction, alignment } = this.props;

    return (
      <Container>
        {files &&
          files.map((file, index, files) => {
            let groupStyle;

            if (files.length === 1) groupStyle = 'single';
            else if (index === 0) {
              groupStyle = 'top';
            } else if (index < files.length - 1 && index > 0) {
              groupStyle = 'middle';
            } else if (index === files.length - 1) groupStyle = 'bottom';

            return (
              <Attachment
                key={`${messageId}-${index}`}
                attachment={file}
                actionHandler={handleAction}
                alignment={alignment}
                groupStyle={groupStyle}
              />
            );
          })}
      </Container>
    );
  }
}
