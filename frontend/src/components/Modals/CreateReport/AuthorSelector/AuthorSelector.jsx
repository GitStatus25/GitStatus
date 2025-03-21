import React from 'react';
import { 
  FormControl, 
  TextField, 
  Autocomplete, 
  FormHelperText, 
  Chip,
  Avatar
} from '@mui/material';
import './AuthorSelector.css';

/**
 * AuthorSelector component presentation layer
 * Renders the author selection UI with multi-select capabilities
 */
const AuthorSelectorTemplate = ({
  authors,
  selectedAuthors,
  disabled,
  formSubmitted,
  onAuthorsChange,
  label = "Authors",
  helperText = "Select authors to include in the report (optional)",
  isRequired = false,
}) => {
  // Ensure authors is always an array
  const authorsArray = Array.isArray(authors) ? authors : [];
  
  return (
    <FormControl fullWidth className="form-field">
      <Autocomplete
        multiple
        value={selectedAuthors}
        onChange={(event, newValue) => onAuthorsChange(newValue)}
        options={authorsArray}
        getOptionLabel={(option) => typeof option === 'object' ? option.login || option.name : option}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant="outlined"
            error={isRequired && formSubmitted && selectedAuthors.length === 0}
            helperText={isRequired && formSubmitted && selectedAuthors.length === 0 ? "Please select at least one author" : ""}
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const tagProps = getTagProps({ index });
            const { key, ...otherTagProps } = tagProps;
            return (
              <Chip
                key={key}
                avatar={option.avatarUrl ? <Avatar src={option.avatarUrl} /> : null}
                label={typeof option === 'object' ? option.login || option.name : option}
                {...otherTagProps}
                className="author-chip"
              />
            );
          })
        }
        disabled={disabled}
      />
      <FormHelperText className="info-text">
        {helperText}
      </FormHelperText>
    </FormControl>
  );
};

export default AuthorSelectorTemplate; 