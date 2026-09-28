import { msg } from 'mosi/client'
import { mouseEvent } from 'lib/dom'
import { isMac } from 'lib/keys'

let activator
export function configureActivate (_activator = 'openLink') {
  activator = _activator
}

/**
 * Calls the appropriate activation function on the target hintable element.
 * Returns the next mode
 * @param {KeyboardEvent} event - an object that representing a keyboard event
 * @param {HTMLElement} target
 * @returns {string}
 */
export function activate (event, target) {
  return activators[activator](event, target) || 'Reset'
}

/**
 * An object containing callbacks that are executed when a target element
 * is selected using hints mode.
 * @type {{ [key: string]: (event: KeyboardEvent, target: HTMLElement) => string }}
 */
const activators = {
  openLink: (event, target) => {
    if (
      SAKA_PLATFORM === 'firefox' &&
      target.nodeName === 'A' &&
      target.target === '_blank'
    ) {
      // TODO: click() but prevent default
      backgroundOpenLink('openLinkInBackgroundTab', target)
    } else {
      mouseEvent(target, 'click')
    }
    target.focus()
    return 'Reset'
  },
  openLinkInBackgroundTab: (event, target) => {
    openVia('openLinkInBackgroundTab', target, {
      ctrlKey: !isMac,
      metaKey: isMac
    })
    target.focus()
    return 'Reset'
  },
  openLinkInForegroundTab: (event, target) => {
    openVia('openLinkInForegroundTab', target, {
      ctrlKey: !isMac,
      metaKey: isMac,
      shiftKey: true
    })
    target.focus()
    return 'Reset'
  },
  openLinkInNewWindow: (event, target) => {
    openVia('openLinkInNewWindow', target, { shiftKey: true })
    target.focus()
    return 'Reset'
  },
  openLinkInIncognitoWindow: (event, target) => {
    // No platform can open incognito from a click, so a link always goes
    // through the background page; the click is only for href-less targets.
    if (target.href) {
      backgroundOpenLink('openLinkInIncognitoWindow', target)
    } else {
      mouseEvent(target, 'click', {
        shiftKey: true,
        ctrlKey: !isMac,
        metaKey: isMac
      })
    }
    target.focus()
    return 'Reset'
  },
  downloadLink: (event, target) => {
    // TODO: Implement on Firefox
    mouseEvent(target, 'click', { altKey: true })
    target.focus()
    return 'Reset'
  },
  focusLink: (event, target) => {
    target.focus()
    return 'Reset'
  }
}

/**
 * Opens target in a new tab/window. Firefox now honors modifier keys on
 * synthetic clicks, so doing both the modified click and the background-page
 * open (the old workaround) opened every link twice. Links with an href use
 * only the background page there (keeps the container); anything else, or
 * Chrome, gets the modified click.
 */
function openVia (hintType, target, clickModifiers) {
  if (SAKA_PLATFORM === 'firefox' && target.href) {
    backgroundOpenLink(hintType, target)
  } else {
    mouseEvent(target, 'click', clickModifiers)
  }
}

function backgroundOpenLink (hintType, target) {
  if (target.href) {
    msg(1, hintType, target.href)
  }
}
