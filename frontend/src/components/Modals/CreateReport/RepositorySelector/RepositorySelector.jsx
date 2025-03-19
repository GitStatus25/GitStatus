import React from 'react';
import { 
  FormControl, 
  TextField, 
  Autocomplete, 
  FormHelperText, 
  CircularProgress 
} from '@mui/material';
import './RepositorySelector.css';

/**
 * RepositorySelector component presentation layer for selecting GitHub repositories
 */
const RepositorySelectorTemplate = ({
  repository,
  searchQuery,
  searchResults,
  searching,
  repositoryValid,
  formSubmitted,
  onRepositorySelect,
  onSearchQueryChange,
}) => {
  return (
    <FormControl fullWidth className="form-field">
      <Autocomplete
        value={repository}
        onChange={(event, newValue) => onRepositorySelect(newValue)}
        inputValue={searchQuery}
        onInputChange={(event, newInputValue) => onSearchQueryChange(newInputValue)}
        options={searchResults}
        getOptionLabel={(option) => option}
        filterOptions={(x) => x} // Disable built-in filtering
        renderInput={(params) => (
          <TextField
            {...params}
            label="Repository"
            variant="outlined"
            error={formSubmitted && !repositoryValid}
            helperText={formSubmitted && !repositoryValid ? "Please select a valid repository" : ""}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {searching && (
                    <CircularProgress
                      color="inherit"
                      size={20}
                      className="search-loading-indicator"
                    />
                  )}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      <FormHelperText className="info-text">
        Search for a GitHub repository to analyze
      </FormHelperText>
    </FormControl>
  );
};

export default RepositorySelectorTemplate; 