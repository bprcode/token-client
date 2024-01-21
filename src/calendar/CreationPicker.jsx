import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  useTheme,
} from '@mui/material'
import { useState } from 'react'
import { mockPalette, resolveColor, useEventStyles } from './calendarLogic.mjs'

const styledMenuProps = {
  PaperProps: {
    sx: {
      backgroundColor: 'transparent',
      backgroundImage: 'none',
      boxShadow: 'none',

      '& ul': {
        pt: '4px',
        pl: '4px',
        pr: '24px',
        borderRadius: '8px',
      },
      '& li': {
        backgroundColor: '#222',
        minHeight: '40px',
        pl: '1rem',
        mb: '2px',
        borderRadius: '8px',
        borderTop: '1px solid #fff2',
        borderLeft: '1px solid #fff2',
        borderBottom: '1px solid #0008',
        borderRight: '1px solid #0008',
        boxShadow: '2px 2px 8px #000209d0',
      },
      '& li:hover': {
        backgroundColor: 'rgb(64, 64, 64)',
      },
      '& li.Mui-selected': {
        backgroundColor: 'rgb(25, 67, 72)',
      },
      '& li.Mui-selected:hover': {
        backgroundColor: 'rgb(60, 126, 134)',
      },
    },
  },
}

export function CreationPicker() {
  const theme = useTheme()
  const eventStyles = useEventStyles()
  const typeList = [...eventStyles.keys()]
  const palette = mockPalette
  const [type, setType] = useState(typeList[0])
  const [selectedColor, setSelectedColor] = useState(palette[0])

  const rightMargin = '0.5rem'
  const colorIconWidth = '2.5rem'
  const condensedIconWidth = '1.5rem'
  const colorIconHeight = '1.25rem'

  return (
    <div
      style={{
        height: '7rem',
        backgroundColor: '#212121f0',
        borderTop: '1px solid #fff4',
        padding: '0.25rem',
        display: 'flex',
      }}
    >
      <span>
        <FormControl
          variant="standard"
          sx={{
            mr: rightMargin,
            ml: '0.25rem',
          }}
        >
          <InputLabel id="event-type-label">Type</InputLabel>
          <Select
            labelId="event-type-label"
            value={type}
            onChange={e => setType(e.target.value)}
            MenuProps={styledMenuProps}
          >
            {typeList.map(t => (
              <MenuItem
                key={t}
                value={t}
                sx={{
                  '&&': {
                    borderLeft: `0.5rem solid ${resolveColor(t)}`,
                  },
                  minWidth: '120px',
                }}
              >
                {t !== 'Default' ? t : 'Custom'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Show color icon if not creating a custom event. */}
        {type !== 'Default' && (
          <div
            style={{
              display: 'inline-block',
              width: condensedIconWidth,
              height: colorIconHeight,
              borderRadius: '4px',
              backgroundColor: `${resolveColor(type)}`,
              verticalAlign: 'bottom',
              marginBottom: '0.5rem',
            }}
          />
        )}

        {type === 'Default' && (
          <>
            <FormControl variant="standard" sx={{ mr: rightMargin }}>
              <InputLabel id="color-label">Color</InputLabel>
              <Select
                labelId="color-label"
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
                MenuProps={styledMenuProps}
                sx={{
                  '& .palette-block': {
                    width: condensedIconWidth,
                    transform: 'translateX(2px)',
                  },
                }}
              >
                {palette.map((c, i) => (
                  <MenuItem
                    key={c}
                    value={c}
                    sx={{
                      '&&': {
                        px: '0.5rem',
                        borderTopLeftRadius: i === 0 ? '8px' : '0',
                        borderTopRightRadius: i === 0 ? '8px' : '0',
                        borderBottomLeftRadius:
                          i === palette.length - 1 ? '8px' : '0',
                        borderBottomRightRadius:
                          i === palette.length - 1 ? '8px' : '0',
                        mb: 0,
                      },
                    }}
                  >
                    <Box
                      className="palette-block"
                      sx={{
                        backgroundColor: c,
                        width: colorIconWidth,
                        height: colorIconHeight,
                        borderRadius: '2px',
                      }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              id="standard-basic"
              label="Title"
              variant="standard"
              defaultValue="Event"
              sx={{
                maxWidth: '14ch',
              }}
            />
          </>
        )}
      </span>
      {type !== 'Default' && (
        <div
          style={{
            display: 'flex',
            fontSize: '0.75em',
            flexGrow: 1,
            height: '48px',
            justifyContent: 'end',
            alignItems: 'start',
            marginRight: '0.75rem',
            color: theme.palette.primary.light,
          }}
        >
          <div
            style={{
              paddingBottom: '5px',
            }}
          >
            Tap & drag to add
          </div>
        </div>
      )}
    </div>
  )
}
