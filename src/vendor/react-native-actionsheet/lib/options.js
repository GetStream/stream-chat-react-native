/**
 * define all valid options
 */

export default [
  /**
   * a list of button titles (required)
   * @type string[]
   * @example
   *   ['cancel', 'Apple', 'Banana']
   */
  'options',

  /**
   * index of cancel button in options
   * @type int
   */
  'cancelButtonIndex',

  /**
   * index of destructive button in options
   * @type int
   */
  'destructiveButtonIndex',

  /**
   * a title to show above the action sheet
   * @type string
   */
  'title',

  /**
   * a message to show below the title
   * @type string
   */
  'message',

  /**
   * the color used for non-destructive button titles
   * @type string
   * @see http://facebook.github.io/react-native/docs/colors.html
   */
  'tintColor',

  /**
   * The 'callback' function takes one parameter, the zero-based index of the selected item
   * @type (buttonIndex) => void
   * @example
   *   (buttonIndex) => if (buttonIndex === 1) { // do something }
   */
  'onPress'
]
