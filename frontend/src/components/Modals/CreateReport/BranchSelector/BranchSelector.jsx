import React from 'react';
import { 
  FormControl, 
  TextField, 
  Autocomplete, 
  FormHelperText, 
  Chip 
} from '@mui/material';
import './BranchSelector.css';

/**
 * BranchSelector component presentation layer
 * Renders the branch selection UI with multi-select capabilities
 */
const BranchSelectorTemplate = ({
  branches,
  selectedBranches,
  disabled,
  formSubmitted,
  onBranchesChange,
  label = "Branches",
  helperText = "Select branches to include in the report",
  isRequired = true,
}) => {
  return (
    <FormControl fullWidth className="form-field">
      <Autocomplete
        multiple
        value={selectedBranches}
        onChange={(event, newValue) => onBranchesChange(newValue)}
        options={branches}
        getOptionLabel={(option) => typeof option === 'object' ? option.name : option}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant="outlined"
            error={isRequired && formSubmitted && selectedBranches.length === 0}
            helperText={isRequired && formSubmitted && selectedBranches.length === 0 ? "Please select at least one branch" : ""}
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const tagProps = getTagProps({ index });
            const { key, ...otherTagProps } = tagProps;
            return (
              <Chip
                key={key}
                label={typeof option === 'object' ? option.name : option}
                {...otherTagProps}
                className="branch-chip"
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

export default BranchSelectorTemplate; 