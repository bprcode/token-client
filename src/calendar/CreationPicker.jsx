import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useState } from "react";
import { resolveColor, useEventStyles } from "./calendarLogic.mjs";

export function CreationPicker() {
  const eventStyles = useEventStyles()
  const typeList = [...eventStyles.keys()]
  const [type, setType] = useState(typeList[0])

  return <div style={{
    height: '7rem',
            backgroundColor: '#222b',
            borderTop: '1px solid #fff4',
            padding: '0.25rem',
  }}>
    <div style={{
      display: 'inline-block',
      width: '20px',
      height: '20px',
      borderRadius: '4px',
      backgroundColor: `${resolveColor(type)}`,
      verticalAlign: 'bottom',
      marginRight: '0.5rem',
      marginBottom: '0.5rem',
    }}
    />
    <FormControl variant="standard">
      <InputLabel id="event-type-label">Event</InputLabel>
      <Select
        labelId="event-type-label"
        value={type}
        onChange={e => setType(e.target.value)}
      >
        {typeList.map(t => 
        <MenuItem key={t} value={t}
        sx={{
          backgroundColor: '#222',
          minHeight: '40px',
          minWidth: '120px',
          borderLeft: `0.5rem solid ${resolveColor(t)}`,
          pl: '1rem',
          mb: '0.25rem',
          borderRadius: '8px',
        }}>{t}
        </MenuItem>)}

      </Select>
    </FormControl>
  </div>
}
