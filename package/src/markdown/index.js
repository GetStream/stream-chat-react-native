import React, { Component } from 'react';
import { View } from 'react-native';

import { isArray, isEqual, merge } from 'lodash';
import SimpleMarkdown from 'simple-markdown';

import getRules from './rules';
import styles from './styles';

class Markdown extends Component {
  constructor(props) {
    super(props);
    if (props.enableLightBox && !props.navigator) {
      throw new Error('props.navigator must be specified when enabling lightbox');
    }

    const opts = {
      enableLightBox: props.enableLightBox,
      navigator: props.navigator,
      // eslint-disable-next-line sort-keys
      imageParam: props.imageParam,
      onLink: props.onLink,
      // eslint-disable-next-line sort-keys
      bgImage: props.bgImage,
      onImageOpen: props.onImageOpen,
      // eslint-disable-next-line sort-keys
      onImageClose: props.onImageClose,
      rules: props.rules,
    };

    const mergedStyles = merge({}, styles, props.styles);
    let rules = getRules(mergedStyles, opts);
    rules = merge({}, SimpleMarkdown.defaultRules, rules, opts.rules);

    const parser = SimpleMarkdown.parserFor(rules);
    this.parse = function (source) {
      const blockSource = source + '\n\n';
      return parser(blockSource, { inline: false });
    };
    this.renderer = SimpleMarkdown.outputFor(rules, 'react');
  }

  componentDidMount() {
    if (this.props.onLoad) {
      this.props.onLoad();
    }
  }

  shouldComponentUpdate(nextProps) {
    return !isEqual(nextProps.children, this.props.children);
  }

  render() {
    const child = isArray(this.props.children) ? this.props.children.join('') : this.props.children;

    const tree = this.parse(child);

    return <View style={[styles.view, this.props.styles.view]}>{this.renderer(tree)}</View>;
  }
}

export default Markdown;
