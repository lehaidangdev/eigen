
/*
  do not change this file, it is auto generated by storybook.
*/
import { configure, addDecorator, addParameters, addArgsEnhancer } from '@storybook/react-native';
import "@storybook/addon-actions/register";
import "@storybook/addon-ondevice-actions/register";

import { argsEnhancers } from '@storybook/addon-actions/dist/modern/preset/addArgs';
argsEnhancers.forEach(enhancer => addArgsEnhancer(enhancer))


import { decorators, parameters } from './.storybook/preview';
if (decorators) {
  decorators.forEach((decorator) => addDecorator(decorator));
}
if (parameters) {
  addParameters(parameters);
}

const getStories=() => {
  return [
		require("./src/palette/elements/Button/Button.stories.tsx")
	];
}
configure(getStories, module, false)

  