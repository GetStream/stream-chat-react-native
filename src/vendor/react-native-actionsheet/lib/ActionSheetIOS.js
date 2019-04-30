/**
 * Wrap ActionSheetIOS Api as a component.
 * @see http://facebook.github.io/react-native/docs/actionsheetios.html
 */

import React from 'react'
import { ActionSheetIOS } from 'react-native'
import optionsSchema from './options'

class ActionSheet extends React.Component {
  // shold not update whenever, because nothing rendered
  shouldComponentUpdate () {
    return false
  }

  show () {
    const props = this.props
    const options = {}
    optionsSchema.forEach((name) => {
      const value = props[name]
      if (typeof value !== 'undefined') {
        options[name] = value
      }
    })
    const callback = options.onPress
    delete options.onPress
    ActionSheetIOS.showActionSheetWithOptions(options, callback)
  }

  // need not render anything
  render () {
    return null
  }
}

export default ActionSheet
