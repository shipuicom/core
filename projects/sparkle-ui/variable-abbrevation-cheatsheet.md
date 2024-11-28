# Variable abbrevation cheatsheet

In sparkle we use a lot of abbreviations for variables perticularly for css variables because they aren't compressed before being shipped to the end user, mostly because it crosses over into javascript land, which starts to entail a lot of framework specific parsing.

So in short we wanna keep bundle size small but still keep the utility of the css variables.

Not all things are abbrevated since it makes it harder to read but we try to minify where its sensable

Currently our abbv. mix three variants style, state and component based which means that you could target fx `btn-c-h` to change `button-color-hover` worth noting not all styles have variables in most cases we use variables when a style is internally used multiple times inside a component or in some way overwritten.

So the structure is `component-style-state` for example `btn-c-h` is the color of the button when hovered.

(Improve writing on this)
We could also specify a datepicker selected element as sel to not have it conflicting with the selected state since they are two different elements.

If they are not overwritten we have them as direct styles and can be overwritten by classic css rules with the right specificity.

### Here is a list of component specific abbreviations

- progress-bar = pb
- progress-bar-track = pbt
- range-slider = rs
- range-slider-track = rst
- popover = po
- button-group = btng
- radio = radio
- radio-dot = radiod
- table = table
- tabs = tabs
- toggle = toggle
- toggle-knob = togglek
- datepicker = dp
- chip = chip
- btn = button

### Here is a list of style specific abbreviations

- box-shadow = bs
- background-color = bg
- color = c
- border-radius = br
- border-width = bw
- border = b
- shape = s
- size = si
- icon-height = ih
- icon-width = iw
- icon-color = ic
- icon-rotate = ir
- height = h
- max-height = mh
- min-height = mih
- width = w
- min-width = miw
- max-width = mw
- font = f
- display = d
- opacity = o
- animation-duration = ad

### Here is a list of state specific abbreviations

- hover = h
- active = a
- disabled = d
- selected = s
