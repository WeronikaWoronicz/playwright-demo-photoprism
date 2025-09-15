
const get_from_env_or_throw = (name: string) => {
    console.log(name);
    if(process.env[name])
        return process.env[name]!;
    throw new Error(`Missing required config env variable: ${name}`)
}

export const BASE_URL = get_from_env_or_throw("BASE_URL");

export const photoprism = {
    username: get_from_env_or_throw("PHOTOPRISM_USERNAME"),
    password: get_from_env_or_throw("PHOTOPRISM_PASSWORD")
}