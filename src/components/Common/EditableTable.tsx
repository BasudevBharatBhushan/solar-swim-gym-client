import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Button,
  Box,
  Typography,
  MenuItem,
} from '@mui/material';
import { Edit, Save, Add } from '@mui/icons-material';

export interface Column {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  options?: { value: string | number; label: string }[]; // For select type
  editable?: boolean;
}

interface EditableTableProps {
  title: string;
  columns: Column[];
  data: any[];
  onSave: (newData: any) => void;
  onAdd: (newItem: any) => void; 
}

export const EditableTable = ({ title, columns, data, onSave, onAdd }: EditableTableProps) => {
  const [rows, setRows] = useState<any[]>(data);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editRowData, setEditRowData] = useState<any>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newRowData, setNewRowData] = useState<any>({});

  useEffect(() => {
    setRows(data);
  }, [data]);

  const handleEditClick = (row: any) => {
    setEditingId(row.id || row.age_group_id || row.subscription_term_id); // Fallback for various ID names
    setEditRowData({ ...row });
  };

  const handleSaveClick = () => {
    onSave(editRowData);
    setEditingId(null);
    setEditRowData({});
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setNewRowData({});
  };

  const handleSaveNewClick = () => {
    onAdd(newRowData);
    setIsAdding(false);
    setNewRowData({});
  };

  const handleCancelNew = () => {
    setIsAdding(false);
    setNewRowData({});
  };

  const handleChange = (field: string, value: any, isNew: boolean = false) => {
    if (isNew) {
      setNewRowData((prev: any) => ({ ...prev, [field]: value }));
    } else {
      setEditRowData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mb: 4, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <Button startIcon={<Add />} variant="contained" size="small" onClick={handleAddClick} disabled={isAdding}>
          Add Row
        </Button>
      </Box>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader size="small" aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} style={{ minWidth: 100 }}>
                  {column.label}
                </TableCell>
              ))}
              <TableCell align="right" style={{ minWidth: 80 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* New Row Input */}
            {isAdding && (
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id}>
                      <TextField
                        fullWidth
                        size="small"
                        select={column.type === 'select'}
                        type={column.type === 'number' ? 'number' : 'text'}
                        value={newRowData[column.id] || ''}
                        onChange={(e) => handleChange(column.id, e.target.value, true)}
                      >
                        {column.type === 'select' && column.options?.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </TextField>
                  </TableCell>
                ))}
                 <TableCell align="right">
                  <IconButton onClick={handleSaveNewClick} color="primary" size="small">
                    <Save />
                  </IconButton>
                  <Button size="small" onClick={handleCancelNew} color="inherit">Cancel</Button>
                </TableCell>
              </TableRow>
            )}

            {/* Existing Rows */}
            {rows.map((row, index) => {
              // Determine unique ID for the row
              const rowId = row.id || row.age_group_id || row.subscription_term_id || index;
              const isEditing = rowId === editingId;

              return (
                <TableRow hover role="checkbox" tabIndex={-1} key={rowId}>
                  {columns.map((column) => {
                    const value = isEditing ? editRowData[column.id] : row[column.id];
                    return (
                      <TableCell key={column.id}>
                        {isEditing && column.editable !== false ? (
                          <TextField
                            fullWidth
                            size="small"
                            select={column.type === 'select'}
                            type={column.type === 'number' ? 'number' : 'text'}
                            value={value}
                            onChange={(e) => handleChange(column.id, e.target.value)}
                          >
                             {column.type === 'select' && column.options?.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        ) : (
                          value
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell align="right">
                    {isEditing ? (
                      <IconButton onClick={handleSaveClick} color="primary" size="small">
                        <Save />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => handleEditClick(row)} size="small">
                        <Edit />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
