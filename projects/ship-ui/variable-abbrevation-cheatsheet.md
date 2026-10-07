# Variable abbrevation cheatsheet

In ship we use a lot of abbreviations for variables perticularly for css variables because they aren't compressed before being shipped to the end user, mostly because it crosses over into javascript land, which starts to entail a lot of framework specific parsing.

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
- button = btn
- accordion = acc
- alert = alert
- avatar = avatar
- blueprint = bp
- breadcrumbs = crumb
- card = card
- chart (sparkline) = chart
- chat = chat
- checkbox = cb
- code = code
- code-input = ci
- color-picker = cp
- dialog = dialog
- divider = divider
- editor = editor
- event-card = ec
- file-upload = fu
- form-field = ff
- icon = icon
- kbd = kbd
- list = list
- menu = menu
- select = select
- sidenav = sidenav
- spinner = spinner
- spreadsheet = shs
- stepper = step
- toggle-card = tc
- tooltip = tt
- tree = tree
- video = vid
- video-playlist = vpl
- layout page/section/setting = page / section / setting
- layout empty-state = empty
- layout stat / stat-trend / stat-goal / stat-ring = stat / trend / goal / ring
- layout ranking / achievement / inbox = ranking / ach / inbox
- layout table-view / details / timeline / toolbar = tv / details / timeline / toolbar

### Here is a list of style specific abbreviations

- box-shadow = bs
- padding-y (top/bottom) = py
- padding-x (left/right) = px
- padding-left / padding-right (when the two sides differ) = pl / pr
- background-color = bg
- color = c
- border-radius = br
- border-width = bw
- border-color = bc
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
- percentage (0–100, set by the component) = pct
- index (an internal counter set by the component) = i

### Here is a list of state specific abbreviations

- hover = h
- active = a
- disabled = d
- selected = s
- focus = f

### Global knobs

A global knob is the component token itself, set on `:root`: the `$shipButtonShadow` / `$shipFormFieldShadow` /
`$shipChipShadow` flags emit `--btn-bs` / `--ff-bs` / `--chip-bs` on `:root`, and the component reads that token without
redeclaring it. There are no separate `--ship-*` names.

A sub-element keeps the component prefix and its own name before the style: `--tree-caret-c-h`, `--editor-btn-bg-a`,
`--shs-sel-bc`, `--vid-btn-bg-h`. Internal counters the component sets from a host binding are prefixed too
(`--tree-guide-i`, `--ranking-pct`).
