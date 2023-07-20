import React, { useContext, useReducer } from "react";
import {
  DISPLAY_ALERT,
  CLEAR_ALERT,
  REGISTER_USER_BEGIN,
  REGISTER_USER_SUCCESS,
  REGISTER_USER_ERROR,
  LOGIN_USER_BEGIN,
  LOGIN_USER_SUCCESS,
  LOGIN_USER_ERROR,
  LOGOUT_USER,
  TOGGLE_SIDEBAR,
  HANDLE_CHANGE,
  CLEAR_VALUES,
  CREATE_JOB_BEGIN,
  CREATE_JOB_SUCCESS,
  CREATE_JOB_ERROR,
  UPDATE_USER_BEGIN,
  UPDATE_USER_SUCCESS,
  UPDATE_USER_ERROR,
  GET_JOBS_BEGIN,
  GET_JOBS_SUCCESS,
  SET_EDIT_JOB,
  DELETE_JOB_BEGIN,
  EDIT_JOB_BEGIN,
  EDIT_JOB_SUCCESS,
  EDIT_JOB_ERROR,
  SHOW_STATS_BEGIN,
  SHOW_STATS_SUCCESS,
  // SET_EDIT_JOB,
  // DELETE_JOB_BEGIN,
  // CHANGE_PAGE,
  // CLEAR_FILTERS,
} from "./actions";
import reducer from "./reducer";

import axios from "axios";

const token = localStorage.getItem("token");
const user = localStorage.getItem("user");
const userLocation = localStorage.getItem("location");

export const initialState = {
  isLoading: false,
  showAlert: false,
  alertText: "",
  alertType: "",
  user: user ? JSON.parse(user) : null,
  token: token,
  userLocation: userLocation || "",
  showSidebar: false,
  isEditing: false,
  editJobId: "",
  position: "",
  company: "",
  jobLocation: userLocation || "",
  jobType: "full-time",
  jobTypeOptions: ["full-time", "part-time", "remote", "internship"],
  status: "pending",
  statusOptions: ["pending", "interview", "declined"],
  jobs: [],
  totalJobs: 0,
  page: 1,
  numOfPages: 1,
  stats: {},
  monthlyApplications: [],
  // search: '',
  // searchStatus: 'all',
  // searchType: 'all',
  // sort: 'latest',
  // sortOptions: ['latest', 'oldest', 'a-z', 'z-a'],
};

const AppContext = React.createContext();
const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const authFetch = axios.create({
    baseURL: "api/v1",
  });

  // response interceptor
  authFetch.interceptors.request.use(
    (config) => {
      config.headers.common["Authorization"] = `Bearer ${state.token}`;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // response interceptor
  authFetch.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response.status === 401) {
        dispatch({ type: LOGOUT_USER });
        removeUserFromLocalStorage();
        return;
      }
      return Promise.reject(error);
    }
  );

  const displayAlert = () => {
    dispatch({
      type: DISPLAY_ALERT,
    });
    clearAlert();
  };

  const clearAlert = () => {
    setTimeout(() => {
      dispatch({
        type: CLEAR_ALERT,
      });
    }, 3000);
  };

  //************************************ LOCAL-STORAGE-START ************************************
  // Store user,token,location into localStorage bcoz after refreshing the page it will uses local storage values
  const addUserToLocalStorage = ({ user, token, location }) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    localStorage.setItem("location", location);
  };

  const removeUserFromLocalStorage = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("location");
  };

  //************************************ LOCAL-STORAGE-END ************************************

  //************************************ REGISTER-USER-START ************************************
  const registerUser = async (currentUser) => {
    dispatch({ type: REGISTER_USER_BEGIN });
    try {
      const { data } = await axios.post("/api/v1/auth/register", currentUser);
      const { user, token, location } = data;
      dispatch({
        type: REGISTER_USER_SUCCESS,
        payload: {
          user,
          token,
          location,
        },
      });

      addUserToLocalStorage({
        user,
        token,
        location,
      });
    } catch (error) {
      dispatch({
        type: REGISTER_USER_ERROR,
        payload: { msg: error.response.data.msg },
      });
    }
    clearAlert();
  };
  //************************************ REGISTER-USER-END ************************************

  //************************************ LOGIN-USER-START ************************************
  const loginUser = async (currentUser) => {
    dispatch({ type: LOGIN_USER_BEGIN });
    try {
      const { data } = await axios.post("/api/v1/auth/login", currentUser);
      const { user, token, location } = data;

      dispatch({
        type: LOGIN_USER_SUCCESS,
        payload: { user, token, location },
      });

      addUserToLocalStorage({ user, token, location });
    } catch (error) {
      // console.log(error.response)
      dispatch({
        type: LOGIN_USER_ERROR,
        payload: { msg: error.response.data.msg },
      });
    }
    clearAlert();
  };
  //************************************ LOGIN-USER-END ************************************

  //************************************ TOGGLE-SIDEBAR-START ******************************
  const toggleSidebar = () => {
    dispatch({ type: TOGGLE_SIDEBAR });
  };
  //************************************ TOGGLE-SIDEBAR-END ********************************

  //************************************ LOGOUT-USER-START *********************************
  const logoutUser = () => {
    dispatch({ type: LOGOUT_USER });
    removeUserFromLocalStorage();
  };
  //************************************ LOGOUT-USER-END ***********************************

  //************************************ UPDATE-USER-START *********************************
  const updateUser = async (currentUser) => {
    dispatch({ type: UPDATE_USER_BEGIN });
    try {
      const { data } = await authFetch.patch("/auth/updateUser", {
        ...currentUser,
      });
      const { user, token, location } = data;

      dispatch({
        type: UPDATE_USER_SUCCESS,
        payload: { user, token, location },
      });

      addUserToLocalStorage({ user, token, location });
    } catch (error) {
      dispatch({
        type: UPDATE_USER_ERROR,
        payload: { msg: error.response.data.msg },
      });
    }
    clearAlert();
  };
  //************************************ UPDATE-USER-END *************************************

  //************************************ HANDLE-CHANGE-START *********************************
  const handleChange = ({ name, value }) => {
    dispatch({
      type: HANDLE_CHANGE,
      payload: { name, value },
    });
  };

  const clearValues = () => {
    dispatch({ type: CLEAR_VALUES });
  };
  //************************************ HANDLE-CHANGE-END ***********************************

  //************************************ CREATE-JOBS-START ***********************************
  const createJob = async () => {
    dispatch({ type: CREATE_JOB_BEGIN });
    try {
      const { position, company, jobLocation, jobType, status } = state;

      await authFetch.post("/jobs", {
        company,
        position,
        jobLocation,
        jobType,
        status,
      });
      dispatch({
        type: CREATE_JOB_SUCCESS,
      });
      dispatch({ type: CLEAR_VALUES });
    } catch (error) {
      if (error.response.status === 401) return;
      dispatch({
        type: CREATE_JOB_ERROR,
        payload: { msg: error.response.data.msg },
      });
    }
    clearAlert();
  };
  //************************************ CREATE-JOBS-END ************************************

  //************************************ GET-JOBS-START ***********************************

  const getJobs = async () => {
    const url = "/jobs";

    dispatch({ type: GET_JOBS_BEGIN });

    try {
      const { data } = await authFetch.get(url);
      const { jobs, totalJobs, numOfPages } = data;

      console.log(data);

      dispatch({
        type: GET_JOBS_SUCCESS,
        payload: {
          jobs,
          totalJobs,
          numOfPages,
        },
      });
    } catch (error) {
      console.log(error.response);
      // logoutUser()
    }
    clearAlert();
  };

  //************************************ GET-JOBS-END *************************************

  //************************************ SET-EDIT-JOB-START *******************************
  const setEditJob = (id) => {
    dispatch({ type: SET_EDIT_JOB, payload: { id } });
  };

  const editJob = async () => {
    dispatch({ type: EDIT_JOB_BEGIN });

    try {
      const { company, position, jobLocation, jobType, status } = state;

      await authFetch.patch(`/jobs/${state.editJobId}`, {
        company,
        position,
        jobLocation,
        jobType,
        status,
      });

      dispatch({ type: EDIT_JOB_SUCCESS });
      dispatch({ type: CLEAR_VALUES });
    } catch (error) {
      if (error.response.status === 401) return;
      dispatch({
        type: EDIT_JOB_ERROR,
        payload: {
          msg: error.response.data.msg,
        },
      });
    }
    clearAlert()
  };

  //************************************ SET-EDIT-JOB-END *********************************

  //************************************ DELETE-JOB-START *********************************
  const deleteJob = async (jobId) => {
    dispatch({ type: DELETE_JOB_BEGIN });
    try {
      await authFetch.delete(`/jobs/${jobId}`);
      getJobs();

      console.log(`Job deleted : ${jobId}`);
    } catch (error) {
      console.log(error.response);
      // logoutUser()
    }
  };
  //************************************ DELETE-JOB-END ***********************************


  //************************************ SHOW-STATS-START *********************************
  
  const showStats = async () => {
    
    dispatch({type:SHOW_STATS_BEGIN})

    try {
      
      const {data} = await authFetch.get('/jobs/stats')
      dispatch({
        type:SHOW_STATS_SUCCESS,
        payload:{
          stats:data.defaultStats,
          monthlyApplications: data.monthlyApplications,
        },
      })

    } catch (error) {
      console.log(error.response);
      // logoutUser()
    }

    clearAlert()

  }
  
  
  //************************************ SHOW-STATS-END ***********************************

  
  
  // const getJobs = async () => {
  //   const { page, search, searchStatus, searchType, sort } = state
  //   let url = `/jobs?page=${page}&status=${searchStatus}&jobType=${searchType}&sort=${sort}`
  //   if (search) {
  //     url = url + `&search=${search}`
  //   }
  //   dispatch({ type: GET_JOBS_BEGIN })
  //   try {
  //     const { data } = await authFetch(url)
  //     const { jobs, totalJobs, numOfPages } = data
  //     dispatch({
  //       type: GET_JOBS_SUCCESS,
  //       payload: {
  //         jobs,
  //         totalJobs,
  //         numOfPages,
  //       },
  //     })
  //   } catch (error) {
  //     // logoutUser()
  //   }
  //   clearAlert()
  // }

  // const showStats = async () => {
  //   dispatch({ type: SHOW_STATS_BEGIN })
  //   try {
  //     const { data } = await authFetch('/jobs/stats')
  //     dispatch({
  //       type: SHOW_STATS_SUCCESS,
  //       payload: {
  //         stats: data.defaultStats,
  //         monthlyApplications: data.monthlyApplications,
  //       },
  //     })
  //   } catch (error) {
  //     logoutUser()
  //   }
  //   clearAlert()
  // }

  // const setEditJob = (id) => {
  //   dispatch({ type: SET_EDIT_JOB, payload: { id } })
  // }

  // const editJob = async () => {
  //   dispatch({ type: EDIT_JOB_BEGIN })
  //   try {
  //     const { position, company, jobLocation, jobType, status } = state

  //     await authFetch.patch(`/jobs/${state.editJobId}`, {
  //       company,
  //       position,
  //       jobLocation,
  //       jobType,
  //       status,
  //     })
  //     dispatch({
  //       type: EDIT_JOB_SUCCESS,
  //     })
  //     dispatch({ type: CLEAR_VALUES })
  //   } catch (error) {
  //     if (error.response.status === 401) return
  //     dispatch({
  //       type: EDIT_JOB_ERROR,
  //       payload: { msg: error.response.data.msg },
  //     })
  //   }
  //   clearAlert()
  // }
  // const deleteJob = async (jobId) => {
  //   dispatch({ type: DELETE_JOB_BEGIN })
  //   try {
  //     await authFetch.delete(`/jobs/${jobId}`)
  //     getJobs()
  //   } catch (error) {
  //     logoutUser()
  //   }
  // }

  // const changePage = (page) => {
  //   dispatch({ type: CHANGE_PAGE, payload: { page } })
  // }
  // const clearFilters = () => {
  //   dispatch({ type: CLEAR_FILTERS })
  // }

  return (
    <AppContext.Provider
      value={{
        ...state,
        displayAlert,
        registerUser,
        loginUser,
        removeUserFromLocalStorage,
        toggleSidebar,
        logoutUser,
        updateUser,
        handleChange,
        clearValues,
        createJob,
        getJobs,
        setEditJob,
        deleteJob,
        editJob,
        showStats,
        // setEditJob,
        // editJob,
        // deleteJob,
        // changePage,
        // clearFilters,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// make sure use
export const useAppContext = () => {
  return useContext(AppContext);
};

export { AppProvider };
