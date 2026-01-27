import React from 'react'
import { IconButton } from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteIcon from '@mui/icons-material/Delete'

interface EditableRowProps {
  firstColumnContent: React.ReactNode
  showMoveUp?: boolean
  onMoveUp?: () => void
  isMoveUpDisabled?: boolean
  showMoveDown?: boolean
  onMoveDown?: () => void
  isMoveDownDisabled?: boolean
  showDelete?: boolean
  onDelete?: () => void
  isDeleteDisabled?: boolean
}

export const EditableRow: React.FC<EditableRowProps> = ({
  firstColumnContent,
  showMoveUp,
  onMoveUp,
  isMoveUpDisabled,
  showMoveDown,
  onMoveDown,
  isMoveDownDisabled,
  showDelete,
  onDelete,
  isDeleteDisabled,
}) => {
  return (
    <tr>
      <td style={{ width: '50%' }}>{firstColumnContent}</td>
      <td style={{ textAlign: 'right', width: '50%' }}>
        <>
          {showMoveUp && (
            <IconButton
              size="small"
              onClick={onMoveUp}
              tabIndex={-1}
              disabled={isMoveUpDisabled}
              style={{
                outline: 'none',
              }}
            >
              <ArrowUpwardIcon
                style={{
                  color: isMoveUpDisabled ? 'lightgray' : '#667eea',
                }}
              />
            </IconButton>
          )}
          {showMoveDown && (
            <IconButton
              size="small"
              onClick={onMoveDown}
              tabIndex={-1}
              disabled={isMoveDownDisabled}
              style={{
                outline: 'none',
              }}
            >
              <ArrowDownwardIcon
                style={{
                  color: isMoveDownDisabled ? 'lightgray' : '#667eea',
                }}
              />
            </IconButton>
          )}
          {showDelete && (
            <IconButton
              size="small"
              onClick={onDelete}
              tabIndex={-1}
              disabled={isDeleteDisabled}
              style={{ outline: 'none' }}
            >
              <DeleteIcon
                style={{
                  color: isDeleteDisabled ? 'lightgray' : 'red',
                }}
              />
            </IconButton>
          )}
        </>
      </td>
    </tr>
  )
}
