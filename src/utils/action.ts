'use server'
import { createClientForServer } from '@/utils/supabase/server'
import { Provider } from '@supabase/supabase-js'


const signInWith = (provider:Provider) => async (): Promise<{ success: string | null | boolean; error: string | {} ,email?:string}> => {
  const supabase = await createClientForServer()

  const auth_callback_url = `${process.env.SITE_URL}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: auth_callback_url,
    },
  })

  if (error) {
    console.log(error)
    return { success: null, error: { message: 'OAuth sign-in failed' } };
  }

  if (data?.url) {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if(user.user?.email){
      return { success: true,email:user?.user?.email ,error: { message: "successfully logged in" } };
    }else{
      console.log(userError);
    }
    return { success: true, error: { message: "successfully logged in" } };
  } else {
    return { success: null, error: { message: "No redirect URL found" } };
  }}

const signinWithGithub = signInWith('github')

const signOut = async () => {
  const supabase = await createClientForServer()
  await supabase.auth.signOut()
}

const signupWithEmailPassword = async (
  prev: any,
  formData: FormData
): Promise<{ success: string | null | boolean; error: string | null ,message?:string}> => {
  const supabase = await createClientForServer();

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: { name: formData.get('name') as string }, // Store name in Supabase metadata
    },
  });

  if (error) {
    console.log('Signup error:', error.message);
    return {
      success: null,
      error: error.message,
    };
  }

  return {
    success:true,
    message: 'Please check your email to confirm your account.',
    error: null,
  };
};


const signinWithEmailPassword = async  (prev: any, formData: FormData): Promise<{ success: null; error: string | null }> => {
  const supabase = await createClientForServer();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    console.log('error', error);
    return {
      success: null,
      error: error.message, // Return error as a string
    };
  }
  console.log(error);
  

  return {
    success: null,
    error: null,
  };
};
const sendResetPasswordEmail = async  (prev: any, formData:FormData): Promise<{ success: null | string; error: { message: string } | null | string }> => {
  const supabase = await createClientForServer()

  const { data, error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
  )

  if (error) {
    console.log('error', error)

    return {
      success: '',
      error: error.message,
    }
  }

  return {
    success: 'Please check your email',
    error: '',
  }
}

const updatePassword = async  (prev: any, formData:FormData): Promise<{ success: null | string; error: { message: string } | null | string }> => {
  const supabase = await createClientForServer()

  const { data, error } = await supabase.auth.updateUser({
    password: formData.get('password') as string,
  })

  if (error) {
    console.log('error', error)

    return {
      success: '',
      error: error.message,
    }
  }

  return {
    success: 'Password updated',
    error: '',
  }
}

// const signinWithMagicLink = async (prev, formData) => {
//   const supabase = await createClientForServer()

//   const { data, error } = await supabase.auth.signInWithOtp({
//     email: formData.get('email'),
//   })

//   if (error) {
//     console.log('error', error)

//     return {
//       success: null,
//       error: error.message,
//     }
//   }

//   return {
//     success: 'Please check your email',
//     error: null,
//   }
// }

// const signinWithOtp = async (prev, formData) => {
//   const supabase = await createClientForServer()

//   const email = formData.get('email')

//   const { data, error } = await supabase.auth.signInWithOtp({
//     email,
//   })

//   if (error) {
//     console.log('error', error)

//     return {
//       success: null,
//       error: error.message,
//     }
//   }

//   redirect(`/verify-otp?email=${email}`)
// }

// const verifyOtp = async (prev, formData) => {
//   const supabase = await createClientForServer()

//   const { data, error } = await supabase.auth.verifyOtp({
//     token: formData.get('token'),
//     email: prev.email,
//     type: 'email',
//   })

//   if (error) {
//     console.log('error', error)

//     return {
//       success: null,
//       error: error.message,
//     }
//   }

//   redirect('/')
// }

export {
  signOut,
  signupWithEmailPassword,
  signinWithGithub,
  signinWithEmailPassword,
  sendResetPasswordEmail,
  updatePassword,
  // signinWithMagicLink,
  // signinWithOtp,
  // verifyOtp,
}